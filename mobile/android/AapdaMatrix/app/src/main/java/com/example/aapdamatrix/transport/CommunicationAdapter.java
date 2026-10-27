package com.example.aapdamatrix.transport;

import com.example.aapdamatrix.database.MessageEntity;
import java.util.List;

/**
 * Universal Modular Communication Transport Interface for AAPDA MATRIX
 */
public interface CommunicationAdapter {
    /**
     * Check if this transport channel is physically and logically available on this device
     */
    boolean isAvailable();

    /**
     * Attempt immediate message packet dispatch
     */
    boolean sendMessage(MessageEntity message);

    /**
     * Poll or retrieve inbound messages from this transport
     */
    List<MessageEntity> receiveMessages();

    /**
     * Get human-readable diagnostic status of this transport
     */
    String getStatus();

    /**
     * Retry pending queued packets over this transport channel
     */
    int retryPendingMessages();
}
