#include <WiFi.h>
#include <WebServer.h>

// =========================
// CONFIGURACIÓN WIFI
// =========================
const char* ssid = "IgniferS23";
const char* password = "ignifer2213";

// =========================
// LEDS
// =========================
#define LED_WIFI_ROJO 26
#define LED_WIFI_VERDE 12
#define LED_JUEGO_ROJO 2
#define LED_JUEGO_VERDE 4

// =========================
// BOTONES
// =========================
int botonu = 15;
int botond = 18;
int botonl = 19;
int botonr = 21;
int botona = 22;
int botonb = 23;

// =========================
// BATERÍA
// =========================
const float V_BAT_REAL = 4.20;
const float V_ADC_MEDIDO = 1.03;
const float FACTOR_CAL = V_BAT_REAL / V_ADC_MEDIDO;
#define BATTERY_PIN 34
const int SAMPLES = 12;
const float VREF = 3.3;

const float LVL_100 = 4.10;
const float LVL_75  = 3.95;
const float LVL_50  = 3.75;
const float LVL_25  = 3.55;
const float LVL_0   = 3.30;

int lastPercentInterval = 100;

// =========================
// VARIABLES DE ESTADO
// =========================
bool juegoActivo = false;
unsigned long ultimoParpadeo = 0;
bool estadoRojo = false;

WebServer server(80);

// =========================
// FUNCIONES AUXILIARES
// =========================
void parpadeoRojo(int pinRojo, int pinVerde) {
  if (millis() - ultimoParpadeo > 500) {
    ultimoParpadeo = millis();
    estadoRojo = !estadoRojo;
    digitalWrite(pinVerde, LOW);
    digitalWrite(pinRojo, estadoRojo ? HIGH : LOW);
  }
}

float readBatteryVoltageCalibrated() {
  long raw = 0;
  for (int i = 0; i < SAMPLES; i++) {
    raw += analogRead(BATTERY_PIN);
    delay(5);
  }
  float avgRaw = raw / (float)SAMPLES;
  float v_adc = (avgRaw / 4095.0) * VREF;
  float v_bat = v_adc * FACTOR_CAL;
  return v_bat;
}

int getBatteryPercentInterval(float v) {
  int newPercent = lastPercentInterval;

  if (v >= LVL_100) newPercent = 100;
  else if (v >= LVL_75 && lastPercentInterval > 75) newPercent = 100;
  else if (v >= LVL_75) newPercent = 75;
  else if (v >= LVL_50 && lastPercentInterval > 50) newPercent = 75;
  else if (v >= LVL_50) newPercent = 50;
  else if (v >= LVL_25 && lastPercentInterval > 25) newPercent = 50;
  else if (v >= LVL_25) newPercent = 25;
  else if (v >= LVL_0 && lastPercentInterval > 0) newPercent = 25;
  else newPercent = 0;

  lastPercentInterval = newPercent;
  return newPercent;
}

// =========================
// SETUP
// =========================
void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado");
  Serial.println(WiFi.localIP());

  pinMode(LED_WIFI_ROJO, OUTPUT);
  pinMode(LED_WIFI_VERDE, OUTPUT);
  pinMode(LED_JUEGO_ROJO, OUTPUT);
  pinMode(LED_JUEGO_VERDE, OUTPUT);

  int botones[] = {botonu, botond, botonl, botonr, botona, botonb};
  for (int i = 0; i < 6; i++) {
    pinMode(botones[i], INPUT_PULLUP);
  }

  analogSetPinAttenuation(BATTERY_PIN, ADC_11db);

  // LED inicial: WiFi conectado (verde)
  digitalWrite(LED_WIFI_VERDE, HIGH);
  digitalWrite(LED_WIFI_ROJO, LOW);
  digitalWrite(LED_JUEGO_VERDE, LOW);
  digitalWrite(LED_JUEGO_ROJO, HIGH);

  // =========================
  // RUTAS WEB
  // =========================
  server.on("/inicio", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*"); // <--- AGREGAR ESTA LINEA
    juegoActivo = true;
    digitalWrite(LED_JUEGO_ROJO, LOW);
    digitalWrite(LED_JUEGO_VERDE, HIGH);
    server.send(200, "text/plain", "Juego iniciado");
});

  server.on("/fin", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*"); // <--- AGREGAR ESTA LINEA
    juegoActivo = false;
    digitalWrite(LED_JUEGO_VERDE, LOW);
    digitalWrite(LED_JUEGO_ROJO, HIGH);
    server.send(200, "text/plain", "Juego terminado");
  });

  // Estado completo en JSON
  server.on("/estado", HTTP_GET, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*"); // <--- AGREGAR ESTA LINEA
    float vbat = readBatteryVoltageCalibrated();
    int batPercent = getBatteryPercentInterval(vbat);

    String json = "{";
    json += "\"botones\":{";
    json += "\"u\":" + String(!digitalRead(botonu)) + ",";
    json += "\"d\":" + String(!digitalRead(botond)) + ",";
    json += "\"l\":" + String(!digitalRead(botonl)) + ",";
    json += "\"r\":" + String(!digitalRead(botonr)) + ",";
    json += "\"a\":" + String(!digitalRead(botona)) + ",";
    json += "\"b\":" + String(!digitalRead(botonb));
    json += "},";
    json += "\"bateria\":" + String(batPercent);
    json += "}";

    server.send(200, "application/json", json);
  });

  server.begin();
}

// =========================
// LOOP
// =========================
void loop() {
  server.handleClient();

  if (!juegoActivo) {
    parpadeoRojo(LED_JUEGO_ROJO, LED_JUEGO_VERDE);
  }
}
