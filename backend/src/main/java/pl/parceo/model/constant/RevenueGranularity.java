package pl.parceo.model.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RevenueGranularity {
    DAY("%Y-%m-%d"),
    MONTH("%Y-%m-01");

    private final String pattern;

}
