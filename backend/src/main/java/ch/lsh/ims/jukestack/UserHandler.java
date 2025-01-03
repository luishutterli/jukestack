package ch.lsh.ims.jukestack;

import io.vertx.core.http.Cookie;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import io.vertx.sqlclient.Pool;
import io.vertx.sqlclient.Tuple;

public class UserHandler {

  private final Pool dbPool;
  private final AuthenticationManager authManager;

  public UserHandler(Pool dbPool, AuthenticationManager authManager) {
    this.dbPool = dbPool;
    this.authManager = authManager;
  }

  public void createUser(RoutingContext context) {
    JsonObject reqBody = context.body().asJsonObject();
    if (reqBody == null) {
      context.response().setStatusCode(400).end("Invalid input");
      return;
    }

    String email = reqBody.getString("email").toLowerCase().trim();
    String nachname = reqBody.getString("nachname");
    String vorname = reqBody.getString("vorname");
    String passwort = reqBody.getString("passwort");
    if (email == null || nachname == null || vorname == null || passwort == null) {
      context.response().setStatusCode(400).end("Invalid input");
      return;
    }

    // TChecking varchar lengths
    if (email.length() > 255) {
      context.response().setStatusCode(400).end("Invalid input, email too long");
      return;
    } else if (nachname.length() > 45) {
      context.response().setStatusCode(400).end("Invalid input, nachname too long");
      return;
    } else if (vorname.length() > 45) {
      context.response().setStatusCode(400).end("Invalid input, vorname too long");
      return;
    }

    String[] hashData = authManager.hashPassword(passwort);

    dbPool.preparedQuery(
        "insert into TBenutzer (benutzerEmail, benutzerNachname, benutzerVorname, benutzerPWHash, benutzerPWSalt) values (?, ?, ?, ?, ?)")
        .execute(Tuple.of(email, nachname, vorname, hashData[1], hashData[0]))
        .onFailure(err -> {
          context.response().setStatusCode(500).end("Internal server error");
        })
        .onSuccess(res -> {
          context.response().setStatusCode(201).end();
        });
  }

  public void login(RoutingContext context) {
    JsonObject reqBody = context.body().asJsonObject();
    if (reqBody == null) {
      context.response().setStatusCode(400).end("Invalid input");
      return;
    }

    String email = reqBody.getString("email").toLowerCase().trim();
    String passwort = reqBody.getString("passwort");
    if (email == null || passwort == null) {
      context.response().setStatusCode(400).end("Invalid input");
      return;
    }

    dbPool.preparedQuery("select benutzerId, benutzerPWHash, benutzerPWSalt from TBenutzer where benutzerEmail = ?")
        .execute(Tuple.of(email))
        .onFailure(err -> {
          context.response().setStatusCode(500).end("Internal server error");
        })
        .onSuccess(res -> {
          if (res.size() == 0) {
            context.response().setStatusCode(401).end("Invalid credentials");
            return;
          }

          int benutzerId = res.iterator().next().getInteger("benutzerId");
          String benutzerPWHash_hex = res.iterator().next().getString("benutzerPWHash");
          String benutzerPWSalt_hex = res.iterator().next().getString("benutzerPWSalt");

          byte[] benutzerPWHash = Util.hexToBytes(benutzerPWHash_hex);
          byte[] benutzerPWSalt = Util.hexToBytes(benutzerPWSalt_hex);

          boolean pwValid = authManager.verifyPassword(passwort, benutzerPWHash, benutzerPWSalt);

          if (!pwValid) {
            context.response().setStatusCode(401).end("Invalid credentials");
            return;
          }

          authManager
              .generateAndSaveSession(benutzerId, context.request().remoteAddress().host(),
                  context.request().getHeader("User-Agent"))
              .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
              .onSuccess(sessionToken -> context.response()
                  .addCookie(Cookie.cookie("session-token", sessionToken).setHttpOnly(true)
                      .setSecure(authManager.SECURE_COOKIE).setPath("/"))
                  .setStatusCode(201).end());
        });
  }

  public void gerUserInfo(RoutingContext context) {
    Cookie sessionCookie = context.request().getCookie("session-token");
    if (sessionCookie == null) {
      context.response().setStatusCode(401).end("Unauthorized");
      return;
    }

    authManager.validateSession(sessionCookie)
        .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized, " + err.getMessage()))
        .onSuccess(benutzerId -> {
          dbPool.preparedQuery("select benutzerId, benutzerEmail, benutzerNachname, benutzerVorname from TBenutzer where benutzerId = ?")
              .execute(Tuple.of(benutzerId))
              .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
              .onSuccess(res -> {
                if (res.size() == 0) {
                  context.response().setStatusCode(500).end("Internal server error");
                  return;
                }

                JsonObject user = new JsonObject()
                    .put("id", res.iterator().next().getInteger("benutzerId"))
                    .put("email", res.iterator().next().getString("benutzerEmail"))
                    .put("nachname", res.iterator().next().getString("benutzerNachname"))
                    .put("vorname", res.iterator().next().getString("benutzerVorname"));

                context.response().setStatusCode(200).end(user.encode());
              });
        });
  }

  public void verify(RoutingContext context) {
    Cookie sessionCookie = context.request().getCookie("session-token");
    if (sessionCookie == null) {
      context.response().setStatusCode(401).end("Unauthorized");
      return;
    }

    authManager.validateSession(sessionCookie)
        .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
        .onSuccess(benutzerId -> context.response().setStatusCode(200).end());
  }

  public void refresh(RoutingContext context) {
    Cookie sessionCookie = context.request().getCookie("session-token");
    if (sessionCookie == null) {
      context.response().setStatusCode(401).end("Unauthorized");
      return;
    }

    authManager.validateSession(sessionCookie)
        .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
        .onComplete(benutzerId -> {
          if (benutzerId.failed()) {
            return;
          }

          authManager.generateAndSaveSession(benutzerId.result(), context.request().remoteAddress().host(), context.request().getHeader("User-Agent"))
              .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
              .onSuccess(sessionToken -> context.response()
                  .addCookie(Cookie.cookie("session-token", sessionToken).setHttpOnly(true)
                      .setSecure(authManager.SECURE_COOKIE).setPath("/"))
                  .setStatusCode(201).end());
        });
  }
}
