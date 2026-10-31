package pl.parceo.service.core;

import pl.parceo.model.constant.JoinOperator;
import pl.parceo.model.constant.Operation;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;


public record SearchCriteria(
        @Nullable String joinObject,
        @NotNull String key,
        @NotNull Operation operation,
        @NotNull String value,
        @Nullable String secondValue,
        @Nullable JoinOperator joinOperator
) {

    public static Builder builder() {
        return new Builder(null, null, null, null, null, List.of());
    }

    public record Builder(
            @Nullable String joinObject,
            @Nullable String key,
            @Nullable Operation operation,
            @Nullable String value,
            @Nullable String secondValue,
            List<SearchCriteria> criterias
    ) {
        public Builder joinObject(String joinObject) {
            return new Builder(joinObject, key, operation, value, secondValue, criterias);
        }

        public Builder key(String key) {
            return new Builder(joinObject, key, operation, value, secondValue, criterias);
        }

        public Builder operation(Operation operation) {
            return new Builder(joinObject, key, operation, value, secondValue, criterias);
        }

        public Builder value(String value) {
            return new Builder(joinObject, key, operation, value, secondValue, criterias);
        }

        public Builder secondValue(String secondValue) {
            return new Builder(joinObject, key, operation, value, secondValue, criterias);
        }

        public Builder and() {
            return appendCriteria(JoinOperator.AND);
        }

        public Builder or() {
            return appendCriteria(JoinOperator.OR);
        }

        private Builder appendCriteria(JoinOperator joinOperator) {
            final var updated = new ArrayList<>(criterias);
            updated.add(new SearchCriteria(joinObject, key, operation, value, secondValue, joinOperator));
            return new Builder(null, null, null, null, null, List.copyOf(updated));
        }

        public SearchCriteria[] build() {
            if (key == null) {
                return criterias.toArray(new SearchCriteria[0]);
            }
            final var updated = new ArrayList<>(criterias);
            updated.add(new SearchCriteria(joinObject, key, operation, value, secondValue, null));
            return updated.toArray(new SearchCriteria[0]);
        }
    }
}
