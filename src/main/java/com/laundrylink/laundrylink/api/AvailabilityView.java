package com.laundrylink.laundrylink.api;

import java.util.List;

public record AvailabilityView(
        String email,
        List<AvailabilitySlot> slots
) {
}
