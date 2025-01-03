package ch.lsh.ims.jukestack;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

public class HashUtils {

  private final int saltLength;
  private final int hashItterations;
  private final MessageDigest sha512;
  private final MessageDigest sha256;

  public HashUtils(int saltLength, int hashItterations) {
    this.saltLength = saltLength;
    this.hashItterations = hashItterations;

    // Initialize SHA-512
    MessageDigest tempSha512 = null;
    try {
      tempSha512 = MessageDigest.getInstance("SHA-512");
    } catch (NoSuchAlgorithmException e) {
      e.printStackTrace();
    }
    this.sha512 = tempSha512;

    // Initialize SHA-256
    MessageDigest tempSha256 = null;
    try {
      tempSha256 = MessageDigest.getInstance("SHA-256");
    } catch (NoSuchAlgorithmException e) {
      e.printStackTrace();
    }
    this.sha256 = tempSha256;
  }

  public byte[] generateSalt() {
    byte[] salt = new byte[saltLength];
    new SecureRandom().nextBytes(salt);
    return salt;
  }

  public byte[] hashPassword(String password, byte[] salt) {
    return hashPassword(password.getBytes(StandardCharsets.UTF_8), salt);
  }

  public byte[] hashPassword(byte[] password, byte[] salt) {
    byte[] toHash = new byte[password.length + salt.length];
    System.arraycopy(password, 0, toHash, 0, password.length);
    System.arraycopy(salt, 0, toHash, password.length, salt.length);

    byte[] returnHash = sha512.digest(toHash);
    for (int i = 0; i < hashItterations - 1; i++) {
      returnHash = sha512.digest(returnHash);
    }
    return returnHash;
  }

  public byte[] hashSessionToken(byte[] token) {
    byte[] returnHash = sha256.digest(token);
    for (int i = 0; i < hashItterations - 1; i++) {
      returnHash = sha256.digest(returnHash);
    }
    return returnHash;
  }

  public boolean timingSafeCompare(byte[] a, byte[] b) {
    if (a.length != b.length) {
      return false;
    }

    int result = 0;
    for (int i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result == 0;
  }

}
