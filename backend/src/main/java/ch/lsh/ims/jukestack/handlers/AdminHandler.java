package ch.lsh.ims.jukestack.handlers;

import java.util.ArrayList;
import java.util.List;

import ch.lsh.ims.jukestack.AuthenticationManager;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.http.Cookie;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.sqlclient.Pool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.Tuple;

public class AdminHandler {

    private final Pool dbPool;
    private final AuthenticationManager authManager;

    public AdminHandler(Pool dbPool, AuthenticationManager authManager) {
        this.dbPool = dbPool;
        this.authManager = authManager;
    }

    private Future<Boolean> checkAdminAccess(Cookie cookie) {
        Promise<Boolean> promise = Promise.promise();

        authManager.validateSession(cookie)
                .onFailure(promise::fail)
                .onSuccess(benutzerId -> {
                    dbPool.preparedQuery(SQLQueries.SELECT_USER_INFO_BY_ID)
                            .execute(Tuple.of(benutzerId))
                            .onFailure(promise::fail)
                            .onSuccess(res -> {
                                if (res.size() == 0) {
                                    promise.fail(new Throwable("User not found"));
                                } else {
                                    Row user = res.iterator().next();
                                    boolean isAdmin = user.getBoolean("benutzerIstAdmin");
                                    if (isAdmin)
                                        promise.complete(true);
                                    else
                                        promise.fail(new Throwable("User is not an admin"));
                                }
                            });
                });

        return promise.future();
    }

    public void listUsers(RoutingContext context) {
        Cookie sessionCookie = context.request().getCookie("session-token");

        checkAdminAccess(sessionCookie)
                .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized or no admin"))
                .onSuccess(isAdmin -> {
                    dbPool.preparedQuery(SQLQueries.SELECT_ALL_USERS)
                            .execute()
                            .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
                            .onSuccess(rows -> {
                                JsonArray users = new JsonArray();
                                for (Row row : rows) {
                                    JsonObject user = new JsonObject();
                                    user.put("id", row.getInteger("benutzerId"));
                                    user.put("email", row.getString("benutzerEmail"));
                                    user.put("nachname", row.getString("benutzerNachname"));
                                    user.put("vorname", row.getString("benutzerVorname"));
                                    user.put("admin", row.getBoolean("benutzerIstAdmin"));
                                    users.add(user);
                                }

                                context.response().end(users.encode());
                            });
                });
    }

    public void listLentSongs(RoutingContext context) {
        Cookie sessionCookie = context.request().getCookie("session-token");
        String userId = context.request().getParam("id");

        checkAdminAccess(sessionCookie)
                .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized or no admin"))
                .onSuccess(isAdmin -> {
                    dbPool.preparedQuery(SQLQueries.GET_LENDINGS_FOR_USER)
                            .execute(Tuple.of(Integer.valueOf(userId)))
                            .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                            .onSuccess(rows -> {
                                if (rows.size() == 0) {
                                    context.response().end("[]");
                                    return;
                                }
                                List<Integer> songIds = new ArrayList<>();
                                rows.forEach(row -> songIds.add(row.getInteger("songId")));
                                String songIdsStr = String.join(",", songIds.stream().map(Object::toString).toList());

                                dbPool.preparedQuery(SQLQueries.GET_MUSICIANS_FOR_SONGS.replace("?", songIdsStr))
                                        .execute()
                                        .onFailure(err -> context.response().setStatusCode(500)
                                                .end("Internal Server Error"))
                                        .onSuccess(rows2 -> SongHandler.constructLendingsJsonResponse(context, rows,
                                                rows2));
                            });
                });
    }

    public void updateUserLend(RoutingContext context) {
        int lendId;
        try {
            lendId = Integer.parseInt(context.request().getParam("lendId"));
        } catch (Exception e) {
            context.response().setStatusCode(400).end("Invalid input");
            return;
        }

        Cookie sessionCookie = context.request().getCookie("session-token");

        JsonObject reqBody = context.body().asJsonObject();
        if (reqBody == null) {
            context.response().setStatusCode(400).end("Invalid input");
            return;
        }

        int newLendDays = reqBody.getInteger("lendDays");
        if (newLendDays < 1) {
            context.response().setStatusCode(400).end("Invalid input");
            return;
        }

        checkAdminAccess(sessionCookie)
                .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized or no admin"))
                .onSuccess(isAdmin -> dbPool.preparedQuery(SQLQueries.UPDATE_LEND_DAYS_WITH_CHECK)
                        .execute(Tuple.of(newLendDays, lendId))
                        .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                        .onSuccess(rows -> {
                            if (rows.rowCount() == 0) {
                                context.response().setStatusCode(404).end("Lend not found");
                                return;
                            }
                            context.response().end();
                        }));
    }

    public void returnUserLend(RoutingContext context) {
        int lendId;
        try {
            lendId = Integer.parseInt(context.request().getParam("lendId"));
        } catch (Exception e) {
            context.response().setStatusCode(400).end("Invalid input");
            return;
        }

        Cookie sessionCookie = context.request().getCookie("session-token");

        checkAdminAccess(sessionCookie)
                .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized or no admin"))
                .onSuccess(isAdmin -> dbPool.preparedQuery(SQLQueries.RETURN_SONG_ADMIN)
                        .execute(Tuple.of(lendId))
                        .onFailure(err -> context.response().setStatusCode(500).end("Internal Server Error"))
                        .onSuccess(rows -> {
                            if (rows.rowCount() == 0) {
                                context.response().setStatusCode(404).end("Lend not found");
                                return;
                            }
                            context.response().end();
                        }));
    }
}
