package pl.parceo.model.dto;

import pl.parceo.service.core.SearchCriteria;
import jakarta.annotation.Nullable;
import jakarta.validation.Valid;

public record SearchRequest(@Nullable @Valid SearchCriteria[] searchCriteria) {}
