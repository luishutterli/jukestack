package ch.lsh.ims.jukestack;

import java.util.ArrayList;
import java.util.List;

import io.vertx.core.http.Cookie;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.sqlclient.Pool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.Tuple;

public class SongHandler {

    private final Pool dbPool;
    private final AuthenticationManager authManager;

    public SongHandler(Pool dbPool, AuthenticationManager authManager) {
        this.dbPool = dbPool;
        this.authManager = authManager;
    }

    public void listSongs(RoutingContext context) {
        long startTime = System.currentTimeMillis();
        Cookie sessionCookie = context.request().getCookie("session-token");
        if (sessionCookie == null) {
            context.response().setStatusCode(401).end("Unauthorized");
            return;
        }

        authManager.validateSession(sessionCookie)
                .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
                .onSuccess(benutzerId -> {
                    long authTime = System.currentTimeMillis();
                    System.out.println("Authentication time: " + (authTime - startTime) + "ms");

                    dbPool.preparedQuery(
                            "with MaxAusleihen as (select songId, max(ausleihStart) ausleihStart from TAusleihen group by songId) select * from TAusleihen natural join MaxAusleihen natural right join TSongs where ausleihId is null or date_add(ausleihStart, interval ausleihTage DAY) <= now()")
                            .execute()
                            .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                            .onSuccess(rows -> {
                                long firstQueryTime = System.currentTimeMillis();
                                System.out.println("First query time: " + (firstQueryTime - startTime) + "ms");

                                List<Integer> songIds = new ArrayList<>();
                                rows.forEach(row -> songIds.add(row.getInteger(0)));
                                String songIdsStr = String.join(",", songIds.stream().map(Object::toString).toList());
                                System.out.println(songIdsStr);

                                dbPool.preparedQuery("select songId, musikerId, musikerName from TMusiker natural join TBeitraege where songId in (" + songIdsStr + ")")
                                        .execute()
                                        .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                                        .onSuccess(rows2 -> {
                                            long secondQueryTime = System.currentTimeMillis();
                                            System.out.println("Second query time: " + (secondQueryTime - startTime) + "ms");

                                            JsonArray songs = new JsonArray();
                                            for (Row row : rows) {
                                                // Construct JSON response
                                                Integer id = row.getInteger("songId");
                                                JsonObject song = new JsonObject();
                                                song.put("id", id);
                                                song.put("name", row.getString("songName"));
                                                song.put("dauer", ((java.time.Duration)row.getValue("songDauer")).getSeconds());
                                                song.put("jahr", row.getInteger("songJahr"));

                                                JsonArray musiker = new JsonArray();
                                                for (Row row2 : rows2) {
                                                    if (row2.getInteger("songId").equals(id)) {
                                                        JsonObject musikerObj = new JsonObject();
                                                        musikerObj.put("id", row2.getInteger("musikerId"));
                                                        musikerObj.put("name", row2.getString("musikerName"));
                                                        musiker.add(musikerObj);
                                                    }
                                                }
                                                song.put("musiker", musiker);

                                                songs.add(song);
                                            }
                                            long buildTime = System.currentTimeMillis();
                                            System.out.println("Building JSON objects time: " + (buildTime - startTime) + "ms");

                                            String json = songs.encode();
                                            long encodeTime = System.currentTimeMillis();
                                            System.out.println("Encoding time: " + (encodeTime - buildTime) + "ms");

                                            context.response().end(json);
                                        });
                            });
                });
    }

}