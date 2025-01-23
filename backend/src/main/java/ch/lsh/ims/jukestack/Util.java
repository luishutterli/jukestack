package ch.lsh.ims.jukestack;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class Util {

  public static String bytesToHex(byte[] bytes) {
    StringBuilder sb = new StringBuilder();
    for (byte b : bytes) {
      String hex = Integer.toHexString(0xff & b);
      if (hex.length() == 1)
        sb.append('0');
      sb.append(hex);
    }
    return sb.toString();
  }

  public static byte[] hexToBytes(String hex) {
    int length = hex.length();
    byte[] data = new byte[length / 2];
    for (int i = 0; i < length; i += 2) {
      data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4) + Character.digit(hex.charAt(i + 1), 16));
    }
    return data;
  }

  public static String generateValidationMail(String vorname, String nachname, String verifyUrl) {
      String template;
      long start = System.currentTimeMillis();
      try {
        template = new String(Files.readAllBytes(Paths.get("/app/verify-mail.html")));
      } catch (IOException e) {
        e.printStackTrace();
        return null;
      }
      System.out.println("Reading email file took: " + (System.currentTimeMillis() - start) + "ms");
      long start2 = System.currentTimeMillis();
      String name = vorname + " " + nachname;
      template = template.replace("{{name}}", name);
      template = template.replace("verifyUrl", verifyUrl);
      System.out.println("Replacing email variables took: " + (System.currentTimeMillis() - start2) + "ms");
      return template;
  }

}