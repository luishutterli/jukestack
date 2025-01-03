package ch.lsh.ims.jukestack;

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

}
