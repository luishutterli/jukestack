package ch.lsh.ims.jukestack.handlers;

import ch.lsh.ims.jukestack.AuthenticationManager;
import ch.lsh.ims.jukestack.Util;
import io.vertx.core.http.Cookie;
import io.vertx.core.http.CookieSameSite;
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

    if (!email.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
      context.response().setStatusCode(400).end("Email not valid");
      return;
    }

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

    dbPool.preparedQuery(SQLQueries.INSERT_USER)
        .execute(Tuple.of(email, nachname, vorname, hashData[1], hashData[0]))
        .onFailure(
            err -> dbPool.preparedQuery(SQLQueries.SELECT_USER_BY_EMAIL).execute(Tuple.of(email))
                .onFailure(err2 -> context.response().setStatusCode(500).end("Internal server error"))
                .onSuccess(res -> {
                  if (res.size() > 0) {
                    context.response().setStatusCode(409).end("Email already in use");
                  } else {
                    context.response().setStatusCode(500).end("Internal server error");
                  }
                }))
        .onSuccess(res -> context.response().setStatusCode(201).end());
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

    dbPool.preparedQuery(SQLQueries.SELECT_USER_CREDENTIALS)
        .execute(Tuple.of(email))
        .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
        .onSuccess(res -> {
          if (res.size() == 0) {
            context.response().setStatusCode(401).end("Invalid credentials");
            return;
          }

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
              .generateSession(email, context.request().remoteAddress().host(),
                  context.request().getHeader("User-Agent"))
              .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
              .onSuccess(sessionToken -> context.response()
                  .addCookie(Cookie.cookie("__session", sessionToken).setHttpOnly(true)
                      .setSecure(authManager.SECURE_COOKIE).setPath("/").setSameSite(CookieSameSite.STRICT))
                  .setStatusCode(201).end());
        });
  }

  public void gerUserInfo(RoutingContext context) {
    Cookie sessionCookie = context.request().getCookie("__session");

    authManager.validateSession(sessionCookie)
        .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized, " + err.getMessage()))
        .onSuccess(benutzerEmail -> {
          dbPool.preparedQuery(SQLQueries.SELECT_USER_INFO_BY_EMAIL)
              .execute(Tuple.of(benutzerEmail))
              .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
              .onSuccess(res -> {
                if (res.size() == 0) {
                  context.response().setStatusCode(500).end("Internal server error");
                  return;
                }

                JsonObject user = new JsonObject()
                    .put("email", benutzerEmail)
                    .put("nachname", res.iterator().next().getString("benutzerNachname"))
                    .put("vorname", res.iterator().next().getString("benutzerVorname"))
                    .put("admin", res.iterator().next().getBoolean("benutzerIstAdmin"));

                context.response().setStatusCode(200).end(user.encode());
              });
        });
  }

  public void verify(RoutingContext context) {
    Cookie sessionCookie = context.request().getCookie("__session");

    authManager.validateSession(sessionCookie)
        .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
        .onSuccess(benutzerEmail -> context.response().setStatusCode(200).end());
  }

  public void refresh(RoutingContext context) {
    Cookie sessionCookie = context.request().getCookie("__session");

    authManager.validateSession(sessionCookie)
        .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
        .onComplete(benutzerEmail -> {
          if (benutzerEmail.failed())
            return;

          authManager
              .generateSession(benutzerEmail.result(), context.request().remoteAddress().host(),
                  context.request().getHeader("User-Agent"))
              .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
              .onSuccess(sessionToken -> context.response()
                  .addCookie(Cookie.cookie("__session", sessionToken).setHttpOnly(true)
                      .setSecure(authManager.SECURE_COOKIE).setPath("/"))
                  .setStatusCode(201).end());
        });
  }

  // {
  // "field": "email" | "nachname" | "vorname" | "passwort",
  // "value": "new value"
  // }
  // public void updateUserInfo(RoutingContext context) {
  // JsonObject reqBody = context.body().asJsonObject();
  // if (reqBody == null) {
  // context.response().setStatusCode(400).end("Invalid input");
  // return;
  // }

  // String field = reqBody.getString("field").toLowerCase();
  // String value = reqBody.getString("value");

  // if (field == null || value == null) {
  // context.response().setStatusCode(400).end("Invalid input");
  // return;
  // }

  // if (!field.equals("email") && !field.equals("nachname") &&
  // !field.equals("vorname")
  // && !field.equals("passwort")) {
  // context.response().setStatusCode(400).end("Invalid input");
  // return;
  // }

  // if (field.equals("email")) {
  // if (!value.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
  // context.response().setStatusCode(400).end("Email not valid");
  // return;
  // }

  // if (value.length() > 255) {
  // context.response().setStatusCode(400).end("Invalid input, email too long");
  // return;
  // }
  // } else if (field.equals("nachname") && value.length() > 45) {
  // context.response().setStatusCode(400).end("Invalid input, nachname too
  // long");
  // return;
  // } else if (field.equals("vorname") && value.length() > 45) {
  // context.response().setStatusCode(400).end("Invalid input, vorname too long");
  // return;
  // }

  // Cookie sessionCookie = context.request().getCookie("__session");

  // authManager.validateSession(sessionCookie)
  // .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
  // .onSuccess(benutzerId -> {
  // if (field.equals("passwort")) {
  // String[] hashData = authManager.hashPassword(value);

  // dbPool.preparedQuery("update TBenutzer set benutzerPWHash = $1,
  // benutzerPWSalt = $2 where benutzerEmail = $3")
  // .execute(Tuple.of(hashData[1], hashData[0], benutzerId))
  // .onFailure(err -> context.response().setStatusCode(500).end("Internal server
  // error"))
  // .onSuccess(res -> context.response().setStatusCode(200).end());
  // } else {

  // });
  // }

}
