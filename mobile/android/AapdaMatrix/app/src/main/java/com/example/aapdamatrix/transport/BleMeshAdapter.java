package com.example.aapdamatrix.transport;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.util.Log;

import com.example.aapdamatrix.database.MessageEntity;
import com.example.aapdamatrix.database.SosDatabaseHelper;
import com.example.aapdamatrix.mesh.BleMeshAdvertiser;
import com.example.aapdamatrix.mesh.BleMeshScanner;

import java.util.ArrayList;
import java.util.List;

public class BleMeshAdapter implements CommunicationAdapter {
    private static final String TAG = "BleMeshAdapter";

    private final Context context;
    private final SosDatabaseHelper dbHelper;
    private final BluetoothAdapter bluetoothAdapter;
    private final BleMeshAdvertiser advertiser;
    private final BleMeshScanner scanner;

    public BleMeshAdapter(Context context) {
        this.context = context.getApplicationContext();
        this.dbHelper = SosDatabaseHelper.getInstance(this.context);
        BluetoothManager bm = (BluetoothManager) this.context.getSystemService(Context.BLUETOOTH_SERVICE);
        this.bluetoothAdapter = bm != null ? bm.getAdapter() : null;
        this.advertiser = new BleMeshAdvertiser(this.context);
        this.scanner = new BleMeshScanner(this.context);
    }

    @Override
    public boolean isAvailable() {
        return bluetoothAdapter != null && bluetoothAdapter.isEnabled();
    }

    @Override
    public boolean sendMessage(MessageEntity message) {
        if (!isAvailable()) return false;

        try {
            advertiser.startAdvertisingDistress(message);
            dbHelper.updateMessageStatus(message.getMessageId(), "BROADCASTING_BLE");
            Log.i(TAG, "Broadcasting SOS over BLE Mesh: " + message.getMessageId());
            return true;
        } catch (Exception e) {
            Log.e(TAG, "BLE advertising error for: " + message.getMessageId(), e);
            return false;
        }
    }

    @Override
    public List<MessageEntity> receiveMessages() {
        return new ArrayList<>();
    }

    @Override
    public String getStatus() {
        if (bluetoothAdapter == null) return "BLE MESH: HARDWARE NOT SUPPORTED";
        if (!bluetoothAdapter.isEnabled()) return "BLE MESH: BLUETOOTH DISABLED";
        return "BLE MESH: ACTIVE (5s ADVERTISING CYCLE)";
    }

    @Override
    public int retryPendingMessages() {
        if (!isAvailable()) return 0;
        List<MessageEntity> pending = dbHelper.getPendingOutboxMessages();
        int count = 0;
        for (MessageEntity m : pending) {
            if (sendMessage(m)) count++;
        }
        return count;
    }
}
