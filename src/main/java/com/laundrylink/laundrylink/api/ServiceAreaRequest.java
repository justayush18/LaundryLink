package com.laundrylink.laundrylink.api;

import java.util.List;

public record ServiceAreaRequest(
        List<String> zipCodes
) {
}
