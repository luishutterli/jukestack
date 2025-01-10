package ch.lsh.ims.jukestack.handlers;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import ch.lsh.ims.jukestack.AuthenticationManager;
import ch.lsh.ims.jukestack.CloudflareR2Client;
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
    private final CloudflareR2Client r2Client;
    private final int MAX_LENDINGS;
    private final int LENDING_DAYS;
    private final String SONG_BUCKET = "juke-stack";

    public SongHandler(Pool dbPool, AuthenticationManager authManager, CloudflareR2Client r2Client, int maxLendings,
            int lendingDays) {
        this.dbPool = dbPool;
        this.authManager = authManager;
        this.r2Client = r2Client;
        this.MAX_LENDINGS = maxLendings;
        this.LENDING_DAYS = lendingDays;
    }

    public void listSongs(RoutingContext context) {
        Cookie sessionCookie = context.request().getCookie("session-token");
        authManager.validateSession(sessionCookie)
                .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
                .onSuccess(benutzerId -> dbPool.preparedQuery(SQLQueries.LIST_AVAILABLE_SONGS)
                        .execute()
                        .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                        .onSuccess(rows -> {
                            List<Integer> songIds = new ArrayList<>();
                            rows.forEach(row -> songIds.add(row.getInteger(0)));
                            String songIdsStr = String.join(",", songIds.stream().map(Object::toString).toList());

                            dbPool.preparedQuery(SQLQueries.GET_MUSICIANS_FOR_SONGS.replace("?", songIdsStr))
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
            System.out.println("No session cookie provided, lend");
            context.response().setStatusCode(401).end("Unauthorized");
            return;
        }

        authManager.validateSession(sessionCookie)
                .onFailure(err ->{
                    System.out.println("Session validation failed, lend: " + err);
                    context.response().setStatusCode(401).end("Unauthorized");})
                .onSuccess(benutzerId -> dbPool.preparedQuery(SQLQueries.GET_LENDINGS_FOR_USER)
                        .execute(Tuple.of(benutzerId))
                        .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                        .onSuccess(rows -> {
                            if (rows.size() == 0) {
                                context.response().end("[]");
                                return;
                            }
                            List<Integer> songIds = new ArrayList<>();
                            rows.forEach(row -> songIds.add(row.getInteger(0)));
                            String songIdsStr = String.join(",", songIds.stream().map(Object::toString).toList());

                            dbPool.preparedQuery(SQLQueries.GET_MUSICIANS_FOR_SONGS.replace("?", songIdsStr))
                                    .execute()
                                    .onFailure(
                                            err -> context.response().setStatusCode(500).end("Internal Server Error"))
                                    .onSuccess(rows2 -> constructLendingsJsonResponse(context, rows, rows2));
                        }));
    }

    public static void constructLendingsJsonResponse(RoutingContext context, RowSet<Row> rows, RowSet<Row> rows2) {
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
                    dbPool.preparedQuery(SQLQueries.COUNT_ACTIVE_LENDINGS)
                            .execute(Tuple.of(benutzerId))
                            .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                            .onSuccess(rows -> {
                                if (rows.iterator().next().getInteger(0) >= MAX_LENDINGS) {
                                    context.response().setStatusCode(403).end("Too many lendings");
                                    return;
                                }

                                dbPool.preparedQuery(SQLQueries.CHECK_SONG_LENT)
                                        .execute(Tuple.of(songId))
                                        .onFailure(err -> context.response().setStatusCode(500)
                                                .end("Internal Server Error"))
                                        .onSuccess(rows2 -> {
                                            if (rows2.size() > 0) {
                                                context.response().setStatusCode(404)
                                                        .end("Song already lent");
                                                return;
                                            }

                                            dbPool.preparedQuery(SQLQueries.INSERT_LENDING)
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
                .onSuccess(benutzerId -> dbPool.preparedQuery(SQLQueries.RETURN_SONG)
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

    public void generateListenLink(RoutingContext context) {
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
                .onSuccess(benutzerId -> dbPool.preparedQuery(
                        "select * from TSongs natural join TAusleihen where songId = ? and benutzerId = ? and (ausleihStart +  interval ausleihTage DAY) >= now()")
                        .execute(Tuple.of(songId, benutzerId))
                        .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                        .onSuccess(rows -> {
                            if (rows.size() == 0) {
                                context.response().setStatusCode(404).end("Song not lent");
                                return;
                            }

                            String link = r2Client.generatePresignedDownloadUrl(SONG_BUCKET,
                                    rows.iterator().next().getString("songMP3Objekt"), Duration.ofMinutes(15));
                            if (link == null) {
                                context.response().setStatusCode(500).end("Internal Server Error");
                                return;
                            }
                            JsonObject json = new JsonObject();
                            json.put("link", link);
                            context.response().end(json.encode());
                        }));
    }

}