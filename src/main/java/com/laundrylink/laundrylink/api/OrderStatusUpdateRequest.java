package com.laundrylink.laundrylink.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonAlias;

public record OrderStatusUpdateRequest(
        OrderStatus status,
        @JsonProperty("notes")
        @JsonAlias("statusNotes")
        String statusNotes
) {
}
