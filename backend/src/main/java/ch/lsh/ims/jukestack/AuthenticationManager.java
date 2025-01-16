package ch.lsh.ims.jukestack;

import java.security.SecureRandom;
import java.time.Duration;

import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.core.http.Cookie;
import io.vertx.sqlclient.Pool;
import io.vertx.sqlclient.Tuple;

public class AuthenticationManager {

  private final Pool dbPool;
  private final HashUtils hashUtils;

  private final int SESSION_TOKEN_LENGTH;
  private final Duration SESSION_DURATION;
  public final boolean SECURE_COOKIE;

  public AuthenticationManager(Pool dbPool, HashUtils hashUtils, int sessionTokenLength, Duration sessionDuration, boolean secureCookie) {
    this.dbPool = dbPool;
    this.hashUtils = hashUtils;
    this.SESSION_TOKEN_LENGTH = sessionTokenLength;
    this.SESSION_DURATION = sessionDuration;
    this.SECURE_COOKIE = secureCookie;
  }

  /**
   * Hashes a password and returns the salt and hashed password as a String array.
   *
   * @param password The password to hash
   * @return A String array containing the salt and hashed password, in that order
   */
  public String[] hashPassword(String password) {
    byte[] salt = hashUtils.generateSalt();
    byte[] hashedPassword = hashUtils.hashPassword(password, salt);

    String saltStr = Util.bytesToHex(salt);
    String hashedPasswordStr = Util.bytesToHex(hashedPassword);

    return new String[] { saltStr, hashedPasswordStr };
  }

  /**
   * Verifies a password against a stored hash and salt.
   *
   * @param password The password to verify
   * @param pwHash   The stored password hash
   * @param pwSalt   The stored password salt
   * @return True if the password is correct, false otherwise
   */
  public boolean verifyPassword(String password, byte[] pwHash, byte[] pwSalt) {
    byte[] hashedPassword = hashUtils.hashPassword(password, pwSalt);
    return hashUtils.timingSafeCompare(hashedPassword, pwHash);
  }

  /**
   * Generates a new session
   *
   * @param benutzerEmail The email of the user
   * @param userIP     The IP of the user
   * @param userAgent  The user agent of the user
   * @return The generated (unhashed) session token as a hex string, or an error message
   */
  public Future<String> generateSession(String benutzerEmail, String userIP, String userAgent) {
    Promise<String> promise = Promise.promise();

    byte[] sessionToken = new byte[SESSION_TOKEN_LENGTH];
    new SecureRandom().nextBytes(sessionToken);

    byte[] sessionTokenHash = hashUtils.hashSessionToken(sessionToken);

    dbPool.preparedQuery(
        "insert into TAuthSessions (benutzerEmail, sessToken, sessUserIp, sessUserAgent, sessCreated, sessExpires) values (?, ?, ?, ?, now(), now() + interval ? second)")
        .execute(Tuple.of(benutzerEmail, Util.bytesToHex(sessionTokenHash), userIP, userAgent,
            SESSION_DURATION.getSeconds()))
        .onSuccess(res -> {
          promise.complete(Util.bytesToHex(sessionToken));
        })
        .onFailure(err -> {
          System.err.println("Error while creating session: " + err.getMessage());
          promise.fail(err);
        });

    return promise.future();
  }

  /**
   * Validates a session token
   *
   * @param sessionCookie The session token cookie
   * @return The users email if the session is valid, or an error message
   */
  public Future<String> validateSession(Cookie sessionCookie) {
    Promise<String> promise = Promise.promise();

    if (sessionCookie == null || sessionCookie.getValue() == null) {
      promise.fail("No session cookie provided");
      return promise.future();
    }

    String sessionToken = sessionCookie.getValue();
    byte[] hashedSessionToken = hashUtils.hashSessionToken(Util.hexToBytes(sessionToken));

    dbPool.preparedQuery("select benutzerEmail from TAuthSessions where sessToken = ? and sessExpires > now() limit 1")
        .execute(Tuple.of(Util.bytesToHex(hashedSessionToken)))
        .onSuccess(res -> {
          if (res.size() == 0) {
            promise.fail("Invalid or expired session token");
            return;
          }
          promise.complete(res.iterator().next().getString("benutzerEmail"));
        })
        .onFailure(err -> {
          System.err.println("Error while validating session: " + err.getMessage());
          promise.fail(err);
        });

    return promise.future();
  }

}
