package com.example.cafeposbackend.common.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import org.springframework.stereotype.Component;

@Component
public class QRCodeUtil {
  public byte[] png(String content, int size) {
    try {
      ByteArrayOutputStream output = new ByteArrayOutputStream();
      MatrixToImageWriter.writeToStream(
          new MultiFormatWriter().encode(content, BarcodeFormat.QR_CODE, size, size),
          "PNG",
          output);
      return output.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to generate QR code", ex);
    }
  }

  public String base64(String content) {
    return "data:image/png;base64," + Base64.getEncoder().encodeToString(png(content, 320));
  }
}
