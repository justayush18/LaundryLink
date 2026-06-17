package com.laundrylink.laundrylink.api;

import java.util.List;

public record AvailabilityRequest(
        List<AvailabilitySlot> slots
) {
}
