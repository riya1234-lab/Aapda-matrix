package com.example.aapdamatrix.database;

public class MessageEntity {
    private String messageId;
    private String calamityType;
    private double latitude;
    private double longitude;
    private long timestamp;
    private String voiceBase64;
    private int hopCount;
    private int batteryLevel;
    private String status; // QUEUED, BROADCASTING, DELIVERED, SMS_SENT
    private boolean isBatteryDistress;

    public MessageEntity() {}

    public MessageEntity(String messageId, String calamityType, double latitude, double longitude,
                         long timestamp, String voiceBase64, int hopCount, int batteryLevel,
                         String status, boolean isBatteryDistress) {
        this.messageId = messageId;
        this.calamityType = calamityType;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timestamp = timestamp;
        this.voiceBase64 = voiceBase64;
        this.hopCount = hopCount;
        this.batteryLevel = batteryLevel;
        this.status = status;
        this.isBatteryDistress = isBatteryDistress;
    }

    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getCalamityType() { return calamityType; }
    public void setCalamityType(String calamityType) { this.calamityType = calamityType; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public String getVoiceBase64() { return voiceBase64; }
    public void setVoiceBase64(String voiceBase64) { this.voiceBase64 = voiceBase64; }

    public int getHopCount() { return hopCount; }
    public void setHopCount(int hopCount) { this.hopCount = hopCount; }

    public int getBatteryLevel() { return batteryLevel; }
    public void setBatteryLevel(int batteryLevel) { this.batteryLevel = batteryLevel; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isBatteryDistress() { return isBatteryDistress; }
    public void setBatteryDistress(boolean batteryDistress) { isBatteryDistress = batteryDistress; }
}
