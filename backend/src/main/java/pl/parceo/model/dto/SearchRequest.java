package pl.parceo.model.dto;

import pl.parceo.service.core.SearchCriteria;
import jakarta.annotation.Nullable;

public record SearchRequest(@Nullable SearchCriteria[] searchCriteria) {}
