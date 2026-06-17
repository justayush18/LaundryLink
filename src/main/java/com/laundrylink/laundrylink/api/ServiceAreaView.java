package com.laundrylink.laundrylink.api;

import java.util.List;

public record ServiceAreaView(
        String email,
        List<String> zipCodes
) {
}
