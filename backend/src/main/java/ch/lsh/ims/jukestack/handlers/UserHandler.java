package ch.lsh.ims.jukestack.handlers;

import java.time.Duration;

import ch.lsh.ims.jukestack.AuthenticationManager;
import ch.lsh.ims.jukestack.Util;
import io.vertx.core.http.Cookie;
import io.vertx.core.http.CookieSameSite;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mail.MailClient;
import io.vertx.ext.mail.MailMessage;
import io.vertx.ext.web.RoutingContext;
import io.vertx.sqlclient.Pool;
import io.vertx.sqlclient.Tuple;

public class UserHandler {

  private final Pool dbPool;
  private final AuthenticationManager authManager;
  private final MailClient mailClient;
  private final Duration SESSION_DURATION;

  public UserHandler(Pool dbPool, AuthenticationManager authManager, MailClient client, Duration sessionDuration) {
    this.dbPool = dbPool;
    this.authManager = authManager;
    this.mailClient = client;
    this.SESSION_DURATION = sessionDuration;
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

  public void getUserInfo(RoutingContext context) {
    Cookie sessionCookie = context.request().getCookie("__session");

    authManager.validateSession(sessionCookie, false)
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
                    .put("admin", res.iterator().next().getBoolean("benutzerIstAdmin"))
                    .put("emailVerifiziert", res.iterator().next().getBoolean("benutzerEmailVerifiziert"));

                context.response().setStatusCode(200).end(user.encode());
              });
        });
  }

  public void verifyToken(RoutingContext context) {
    Cookie sessionCookie = context.request().getCookie("__session");

    authManager.validateSession(sessionCookie, true)
        .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
        .onSuccess(benutzerEmail -> context.response().setStatusCode(200).end());
  }

  public void refresh(RoutingContext context) {
    Cookie sessionCookie = context.request().getCookie("__session");

    authManager.validateSession(sessionCookie, true)
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
                      .setSecure(authManager.SECURE_COOKIE).setPath("/").setMaxAge(SESSION_DURATION.getSeconds()))
                  .setStatusCode(201).end());
        });
  }

  public void logout(RoutingContext context) {
    Cookie sessionCookie = context.request().getCookie("__session");

    authManager.validateSession(sessionCookie, false)
        .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
        .onSuccess(benutzerEmail -> {
          authManager.invalidateSession(sessionCookie);
          context.getCookie("__session").setMaxAge(0);
          context.response().removeCookies("__session", true);
          context.response().setStatusCode(200).end();
        });
  }

  public void sendVerifyMail(RoutingContext context) {
    Cookie sessionCookie = context.request().getCookie("__session");

    authManager.validateSession(sessionCookie, false)
        .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
        .onSuccess(benutzerEmail -> {
          dbPool.preparedQuery(SQLQueries.SELECT_USER_INFO_BY_EMAIL)
              .execute(Tuple.of(benutzerEmail))
              .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
              .onSuccess(res -> {
                if (res.size() == 0) {
                  context.response().setStatusCode(500).end("Internal server error");
                  return;
                }

                String benutzerVorname = res.iterator().next().getString("benutzerVorname");
                String benutzerNachname = res.iterator().next().getString("benutzerNachname");
                boolean benutzerEmailVerifiziert = res.iterator().next().getBoolean("benutzerEmailVerifiziert");

                if (benutzerEmailVerifiziert) {
                  context.response().setStatusCode(400).end("Email already verified");
                  return;
                }

                authManager.generateAndSaveEmailVerifyToken(benutzerEmail)
                    .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
                    .onComplete((verifyToken) -> {
                      String verifyUrl = "https://jukestack.ch/api/auth/verifyEmail?token=" + verifyToken.result();
                      String mailContent = Util.generateValidationMail(benutzerVorname, benutzerNachname, verifyUrl);
                      mailClient.sendMail(new MailMessage()
                          .setFrom("noreply@jukestack.ch")
                          .setTo(benutzerEmail)
                          .setSubject("Jukestack Email Verification")
                          .setHtml(mailContent))
                          .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
                          .onSuccess(res2 -> context.response().setStatusCode(200).end());
                    });
              });
        });
  }

  public void verifyEmail(RoutingContext context) {
    String token = context.request().getParam("token");
    System.out.println("Verify email token: " + token);

    if (token == null) {
      context.response().setStatusCode(400).end("Invalid input");
      return;
    }

    authManager.verifyEmail(token)
        .onFailure(err -> context.response().setStatusCode(400).end("Invalid token"))
        .onSuccess(benutzerEmail -> {
          context.response().putHeader("Location", "https://jukestack.ch/app/").setStatusCode(302).end();
        });
  }

  public void updateUserInfo(RoutingContext context) {
    JsonObject reqBody = context.body().asJsonObject();
    if (reqBody == null) {
      context.response().setStatusCode(400).end("Invalid input");
      return;
    }

    String field = reqBody.getString("field").toLowerCase();
    JsonObject value = reqBody.getJsonObject("value");

    if (field == null || value == null) {
      context.response().setStatusCode(400).end("Invalid input");
      return;
    }

    if (!field.equals("email") && !field.equals("name") && !field.equals("passwort")) {
      context.response().setStatusCode(400).end("Invalid input");
      return;
    }

    Cookie sessionCookie = context.request().getCookie("__session");

    authManager.validateSession(sessionCookie, true)
        .onFailure(err -> context.response().setStatusCode(401).end("Unauthorized"))
        .onSuccess(benutzerEmail -> {
          if (field.equals("email")) {
            String email = value.getString("email").toLowerCase().trim();
            if (email == null || !email.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
                || email.length() > 255) {
              context.response().setStatusCode(400).end("Invalid email");
              return;
            }

            dbPool.preparedQuery("UPDATE TBenutzer SET benutzerEmail = ?, benutzerEmailVerifiziert = false WHERE benutzerEmail = ?")
                .execute(Tuple.of(email, benutzerEmail))
                .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
                .onSuccess(res -> context.response().setStatusCode(200).end());
          } else if (field.equals("name")) {
            String vorname = value.getString("vorname");
            String nachname = value.getString("nachname");

            if (vorname == null || nachname == null || vorname.length() > 45 || nachname.length() > 45) {
              context.response().setStatusCode(400).end("Invalid name");
              return;
            }

            dbPool
                .preparedQuery("UPDATE TBenutzer SET benutzerVorname = ?, benutzerNachname = ? WHERE benutzerEmail = ?")
                .execute(Tuple.of(vorname, nachname, benutzerEmail))
                .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
                .onSuccess(res -> context.response().setStatusCode(200).end());
          } else if (field.equals("passwort")) {
            String passwort = value.getString("passwort");

            if (passwort == null) {
              context.response().setStatusCode(400).end("Invalid password");
              return;
            }

            String[] hashData = authManager.hashPassword(passwort);

            dbPool.preparedQuery("UPDATE TBenutzer SET benutzerPWHash = ?, benutzerPWSalt = ? WHERE benutzerEmail = ?")
                .execute(Tuple.of(hashData[1], hashData[0], benutzerEmail))
                .onFailure(err -> context.response().setStatusCode(500).end("Internal server error"))
                .onSuccess(res -> context.response().setStatusCode(200).end());
          }
        });
  }

}
