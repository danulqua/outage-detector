#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include "config.h"

unsigned long lastSendMs = 0;
const unsigned long INTERVAL_MS = 30000;

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
  }
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;

  String url = String(SERVER_HOST) + "/hb?secret=" + DEVICE_SECRET + "&v=1";

  bool isHttps = String(SERVER_HOST).startsWith("https://");
  
  if (isHttps) {
    WiFiClientSecure client;
    client.setInsecure();

    if (http.begin(client, url)) {
      int code = http.GET();
      http.end();
    }
  } else {
    WiFiClient client;
    
    if (http.begin(client, url)) {
      int code = http.GET();
      http.end();
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);

  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);

  ensureWiFi();
}

void loop() {
  ensureWiFi();

  unsigned long now = millis();
  if (now - lastSendMs >= INTERVAL_MS) {
    lastSendMs = now;
    sendHeartbeat();
  }

  delay(50);
}
