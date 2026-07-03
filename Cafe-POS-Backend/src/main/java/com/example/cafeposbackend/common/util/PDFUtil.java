package com.example.cafeposbackend.common.util;

import com.lowagie.text.Document;
import com.lowagie.text.Image;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PDFUtil {
  public byte[] document(String title, List<String> lines) {
    try {
      ByteArrayOutputStream output = new ByteArrayOutputStream();
      Document document = new Document();
      PdfWriter.getInstance(document, output);
      document.open();
      document.add(new Paragraph(title));
      document.add(new Paragraph(" "));
      for (String line : lines) document.add(new Paragraph(line));
      document.close();
      return output.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to generate PDF", ex);
    }
  }

  public byte[] qrDocument(String title, byte[] qrPng) {
    try {
      ByteArrayOutputStream output = new ByteArrayOutputStream();
      Document document = new Document();
      PdfWriter.getInstance(document, output);
      document.open();
      document.add(new Paragraph(title));
      document.add(Image.getInstance(qrPng));
      document.close();
      return output.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to generate QR PDF", ex);
    }
  }
}
