package ch.lsh.ims.jukestack;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import io.vertx.core.http.Cookie;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.sqlclient.Pool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.RowSet;
import io.vertx.sqlclient.Tuple;

public class SongHandler {

    private final Pool dbPool;
    private final AuthenticationManager authManager;
    private final int MAX_LENDINGS;
    private final int LENDING_DAYS;

    public SongHandler(Pool dbPool, AuthenticationManager authManager, int maxLendings, int lendingDays) {
        this.dbPool = dbPool;
        this.authManager = authManager;
        this.MAX_LENDINGS = maxLendings;
        this.LENDING_DAYS = lendingDays;
    }

    public void listSongs(RoutingContext context) {
        Cookie sessionCookie = context.request().getCookie("session-token");
        authManager.validateSession(sessionCookie)
                .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
                .onSuccess(benutzerId -> dbPool.preparedQuery(
                        "with MaxAusleihen as (select songId, max(ausleihStart) ausleihStart from TAusleihen group by songId) select * from TAusleihen natural join MaxAusleihen natural right join TSongs where ausleihId is null or date_add(ausleihStart, interval ausleihTage DAY) <= now()")
                        .execute()
                        .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                        .onSuccess(rows -> {
                            List<Integer> songIds = new ArrayList<>();
                            rows.forEach(row -> songIds.add(row.getInteger(0)));
                            String songIdsStr = String.join(",", songIds.stream().map(Object::toString).toList());

                            dbPool.preparedQuery(
                                    "select songId, musikerId, musikerName from TMusiker natural join TBeitraege where songId in ("
                                            + songIdsStr + ")")
                                    .execute()
                                    .onFailure(
                                            err -> context.response().setStatusCode(500).end("Internal Server Error"))
                                    .onSuccess(rows2 -> constructSongsJsonResponse(context, rows, rows2));
                        }));
    }

    private void constructSongsJsonResponse(RoutingContext context, RowSet<Row> rows, RowSet<Row> rows2) {
        JsonArray songs = new JsonArray();
        for (Row row : rows) {
            Integer id = row.getInteger("songId");
            JsonObject song = new JsonObject();
            song.put("id", id);
            song.put("name", row.getString("songName"));
            song.put("dauer", ((java.time.Duration) row.getValue("songDauer")).getSeconds());
            song.put("jahr", row.getInteger("songJahr"));
            song.put("album", row.getString("songAlbum"));

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
        context.response().end(songs.encode());
    }

    public void listLendings(RoutingContext context) {
        Cookie sessionCookie = context.request().getCookie("session-token");
        if (sessionCookie == null) {
            context.response().setStatusCode(401).end("Unauthorized");
            return;
        }

        authManager.validateSession(sessionCookie)
                .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
                .onSuccess(benutzerId -> dbPool.preparedQuery(
                        "select * from TAusleihen natural join TSongs where benutzerId = ? and date_add(ausleihStart, interval ausleihTage DAY) >= now()")
                        .execute(Tuple.of(benutzerId))
                        .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                        .onSuccess(rows -> {
                            List<Integer> songIds = new ArrayList<>();
                            rows.forEach(row -> songIds.add(row.getInteger(0)));
                            String songIdsStr = String.join(",", songIds.stream().map(Object::toString).toList());

                            dbPool.preparedQuery(
                                    "select songId, musikerId, musikerName from TMusiker natural join TBeitraege where songId in ("
                                            + songIdsStr + ")")
                                    .execute()
                                    .onFailure(
                                            err -> context.response().setStatusCode(500).end("Internal Server Error"))
                                    .onSuccess(rows2 -> constructLendingsJsonResponse(context, rows, rows2));
                        }));
    }

    private void constructLendingsJsonResponse(RoutingContext context, RowSet<Row> rows, RowSet<Row> rows2) {
        JsonArray lendings = new JsonArray();
        for (Row row : rows) {
            Integer id = row.getInteger("ausleihId");
            Integer songId = row.getInteger("songId");
            JsonObject lending = new JsonObject();
            lending.put("id", id);
            LocalDateTime ausleihStart = row.getLocalDateTime("ausleihStart");
            lending.put("borrowedAt", ausleihStart.toString());
            lending.put("returnAt", ausleihStart.plusDays(row.getInteger("ausleihTage")).toString());

            JsonObject song = new JsonObject();
            song.put("id", row.getInteger("songId"));
            song.put("name", row.getString("songName"));
            song.put("dauer", ((java.time.Duration) row.getValue("songDauer")).getSeconds());
            song.put("jahr", row.getInteger("songJahr"));
            song.put("album", row.getString("songAlbum"));

            JsonArray musiker = new JsonArray();
            for (Row row2 : rows2) {
                if (row2.getInteger("songId").equals(songId)) {
                    JsonObject musikerObj = new JsonObject();
                    musikerObj.put("id", row2.getInteger("musikerId"));
                    musikerObj.put("name", row2.getString("musikerName"));
                    musiker.add(musikerObj);
                }
            }
            song.put("musiker", musiker);
            lending.put("song", song);
            lendings.add(lending);
        }

        context.response().end(lendings.encode());
    }

    public void lendSong(RoutingContext context) {
        int songId;
        try {
            songId = Integer.parseInt(context.request().getParam("id"));
        } catch (Exception e) {
            context.response().setStatusCode(400).end("Bad Request");
            return;
        }

        Cookie sessionCookie = context.request().getCookie("session-token");
        authManager.validateSession(sessionCookie)
                .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
                .onSuccess(benutzerId -> {
                    dbPool.preparedQuery(
                            "select count(*) from TAusleihen where benutzerId = ? and (ausleihStart +  interval ausleihTage DAY) >= now()")
                            .execute(Tuple.of(benutzerId))
                            .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                            .onSuccess(rows -> {
                                if (rows.iterator().next().getInteger(0) >= MAX_LENDINGS) {
                                    context.response().setStatusCode(403).end("Too many lendings");
                                    return;
                                }

                                dbPool.preparedQuery(
                                        "select * from TAusleihen where songId = ? and (ausleihStart +  interval ausleihTage DAY) >= now()")
                                        .execute(Tuple.of(songId))
                                        .onFailure(err -> context.response().setStatusCode(500)
                                                .end("Internal Server Error"))
                                        .onSuccess(rows2 -> {
                                            if (rows2.size() > 0) {
                                                context.response().setStatusCode(404)
                                                        .end("Song already lent");
                                                return;
                                            }

                                            // TODO: Check if song exists
                                            dbPool.preparedQuery(
                                                    "insert into TAusleihen (songId, benutzerId, ausleihStart, ausleihTage) values (?, ?, now(), ?)")
                                                    .execute(Tuple.of(songId, benutzerId, LENDING_DAYS))
                                                    .onFailure(err -> context.response().setStatusCode(500)
                                                            .end("Internal Server Error"))
                                                    .onSuccess(res -> context.response().end("OK"));
                                        });

                            });
                });
    }

    public void returnSong(RoutingContext context) {
        int songId;
        try {
            songId = Integer.parseInt(context.request().getParam("id"));
        } catch (Exception e) {
            context.response().setStatusCode(400).end("Bad Request");
            return;
        }

        Cookie sessionCookie = context.request().getCookie("session-token");
        authManager.validateSession(sessionCookie)
                .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
                .onSuccess(benutzerId ->
                // TODO: This is not elegant, but it works
                dbPool.preparedQuery(
                        "update TAusleihen set ausleihStart = (now() - interval ausleihTage day) where songId = ? and benutzerId = ? and (ausleihStart +  interval ausleihTage DAY) >= now()")
                        .execute(Tuple.of(songId, benutzerId))
                        .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                        .onSuccess(res -> {
                            if (res.rowCount() == 0) {
                                context.response().setStatusCode(404).end("Song not lent");
                                return;
                            }
                            context.response().end("OK");
                        }));
    }

}