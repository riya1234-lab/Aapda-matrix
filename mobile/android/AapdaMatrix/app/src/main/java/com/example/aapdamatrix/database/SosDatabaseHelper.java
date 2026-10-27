package com.example.aapdamatrix.database;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;

public class SosDatabaseHelper extends SQLiteOpenHelper {
    private static final String TAG = "SosDatabaseHelper";
    private static final String DATABASE_NAME = "aapda_matrix.db";
    private static final int DATABASE_VERSION = 1;

    // Table Names
    private static final String TABLE_SOS_MESSAGES = "sos_messages";
    private static final String TABLE_SEEN_IDS = "seen_message_ids";

    // Column Names
    private static final String COL_MSG_ID = "message_id";
    private static final String COL_CALAMITY = "calamity_type";
    private static final String COL_LAT = "latitude";
    private static final String COL_LNG = "longitude";
    private static final String COL_TIMESTAMP = "timestamp";
    private static final String COL_VOICE_BASE64 = "voice_base64";
    private static final String COL_HOP_COUNT = "hop_count";
    private static final String COL_BATTERY_LEVEL = "battery_level";
    private static final String COL_STATUS = "status";
    private static final String COL_IS_BATTERY_DISTRESS = "is_battery_distress";

    private static final String COL_SEEN_ID = "seen_id";
    private static final String COL_SEEN_TIME = "seen_time";

    private static SosDatabaseHelper instance;

    public static synchronized SosDatabaseHelper getInstance(Context context) {
        if (instance == null) {
            instance = new SosDatabaseHelper(context.getApplicationContext());
        }
        return instance;
    }

    private SosDatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        String createSosTable = "CREATE TABLE " + TABLE_SOS_MESSAGES + " ("
                + COL_MSG_ID + " TEXT PRIMARY KEY, "
                + COL_CALAMITY + " TEXT, "
                + COL_LAT + " REAL, "
                + COL_LNG + " REAL, "
                + COL_TIMESTAMP + " INTEGER, "
                + COL_VOICE_BASE64 + " TEXT, "
                + COL_HOP_COUNT + " INTEGER, "
                + COL_BATTERY_LEVEL + " INTEGER, "
                + COL_STATUS + " TEXT, "
                + COL_IS_BATTERY_DISTRESS + " INTEGER)";

        String createSeenTable = "CREATE TABLE " + TABLE_SEEN_IDS + " ("
                + COL_SEEN_ID + " TEXT PRIMARY KEY, "
                + COL_SEEN_TIME + " INTEGER)";

        db.execSQL(createSosTable);
        db.execSQL(createSeenTable);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_SOS_MESSAGES);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_SEEN_IDS);
        onCreate(db);
    }

    public boolean isMessageSeen(String messageId) {
        if (messageId == null) return true;
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.query(TABLE_SEEN_IDS, new String[]{COL_SEEN_ID},
                COL_SEEN_ID + "=?", new String[]{messageId}, null, null, null);
        boolean exists = (cursor != null && cursor.getCount() > 0);
        if (cursor != null) cursor.close();
        return exists;
    }

    public void markMessageSeen(String messageId) {
        if (messageId == null) return;
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put(COL_SEEN_ID, messageId);
        cv.put(COL_SEEN_TIME, System.currentTimeMillis());
        db.insertWithOnConflict(TABLE_SEEN_IDS, null, cv, SQLiteDatabase.CONFLICT_IGNORE);
    }

    public boolean insertMessage(MessageEntity entity) {
        if (entity == null || entity.getMessageId() == null) return false;
        if (isMessageSeen(entity.getMessageId())) {
            Log.d(TAG, "De-duplication drop: Message ID already seen " + entity.getMessageId());
            return false;
        }

        markMessageSeen(entity.getMessageId());

        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put(COL_MSG_ID, entity.getMessageId());
        cv.put(COL_CALAMITY, entity.getCalamityType());
        cv.put(COL_LAT, entity.getLatitude());
        cv.put(COL_LNG, entity.getLongitude());
        cv.put(COL_TIMESTAMP, entity.getTimestamp());
        cv.put(COL_VOICE_BASE64, entity.getVoiceBase64());
        cv.put(COL_HOP_COUNT, entity.getHopCount());
        cv.put(COL_BATTERY_LEVEL, entity.getBatteryLevel());
        cv.put(COL_STATUS, entity.getStatus());
        cv.put(COL_IS_BATTERY_DISTRESS, entity.isBatteryDistress() ? 1 : 0);

        long result = db.insertWithOnConflict(TABLE_SOS_MESSAGES, null, cv, SQLiteDatabase.CONFLICT_REPLACE);
        return result != -1;
    }

    public List<MessageEntity> getPendingOutboxMessages() {
        List<MessageEntity> list = new ArrayList<>();
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.query(TABLE_SOS_MESSAGES, null,
                COL_STATUS + "!=?", new String[]{"DELIVERED"}, null, null, COL_TIMESTAMP + " DESC");

        if (cursor != null && cursor.moveToFirst()) {
            do {
                list.add(cursorToEntity(cursor));
            } while (cursor.moveToNext());
            cursor.close();
        }
        return list;
    }

    public List<MessageEntity> getAllMessages() {
        List<MessageEntity> list = new ArrayList<>();
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.query(TABLE_SOS_MESSAGES, null, null, null, null, null, COL_TIMESTAMP + " DESC");

        if (cursor != null && cursor.moveToFirst()) {
            do {
                list.add(cursorToEntity(cursor));
            } while (cursor.moveToNext());
            cursor.close();
        }
        return list;
    }

    public void updateMessageStatus(String messageId, String status) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues cv = new ContentValues();
        cv.put(COL_STATUS, status);
        db.update(TABLE_SOS_MESSAGES, cv, COL_MSG_ID + "=?", new String[]{messageId});
    }

    public void incrementHopCount(String messageId) {
        SQLiteDatabase db = this.getWritableDatabase();
        db.execSQL("UPDATE " + TABLE_SOS_MESSAGES + " SET " + COL_HOP_COUNT + " = " + COL_HOP_COUNT + " + 1 WHERE " + COL_MSG_ID + " = ?", new String[]{messageId});
    }

    private MessageEntity cursorToEntity(Cursor cursor) {
        MessageEntity entity = new MessageEntity();
        entity.setMessageId(cursor.getString(cursor.getColumnIndexOrThrow(COL_MSG_ID)));
        entity.setCalamityType(cursor.getString(cursor.getColumnIndexOrThrow(COL_CALAMITY)));
        entity.setLatitude(cursor.getDouble(cursor.getColumnIndexOrThrow(COL_LAT)));
        entity.setLongitude(cursor.getDouble(cursor.getColumnIndexOrThrow(COL_LNG)));
        entity.setTimestamp(cursor.getLong(cursor.getColumnIndexOrThrow(COL_TIMESTAMP)));
        entity.setVoiceBase64(cursor.getString(cursor.getColumnIndexOrThrow(COL_VOICE_BASE64)));
        entity.setHopCount(cursor.getInt(cursor.getColumnIndexOrThrow(COL_HOP_COUNT)));
        entity.setBatteryLevel(cursor.getInt(cursor.getColumnIndexOrThrow(COL_BATTERY_LEVEL)));
        entity.setStatus(cursor.getString(cursor.getColumnIndexOrThrow(COL_STATUS)));
        entity.setBatteryDistress(cursor.getInt(cursor.getColumnIndexOrThrow(COL_IS_BATTERY_DISTRESS)) == 1);
        return entity;
    }
}
