package pl.parceo.service.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import pl.parceo.model.constant.JoinOperator;
import pl.parceo.model.constant.Operation;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;


@Getter
@Builder
@AllArgsConstructor
public class SearchCriteria {

    @NotNull  private Join object;
    @NotNull  private Operation operation;
    @NotNull  private String value;
    @Nullable private String secondValue;
    @Nullable private JoinOperator joinOperator;

    public record Join (@NotNull String key, @Nullable Join inner) {
        public Join(@NotNull String key) {
            this(key, null);
        }
    }

    @lombok.Builder
    public static SearchCriteriaBuilder builder() {
        return new SearchCriteriaBuilder();
    }

    public static class SearchCriteriaBuilder {
        private final List<SearchCriteria> searchCriteriaList = new ArrayList<>();

        public SearchCriteriaBuilder and() {
            this.joinOperator = JoinOperator.AND;
            searchCriteriaList.add(new SearchCriteria(this.object, this.operation, this.value, this.secondValue, this.joinOperator));
            return this;
        }

        public SearchCriteriaBuilder or() {
            this.joinOperator = JoinOperator.OR;
            searchCriteriaList.add(new SearchCriteria(this.object, this.operation, this.value, this.secondValue, this.joinOperator));
            return this;
        }

        private SearchCriteria build() {
            throw new UnsupportedOperationException("build method is not supported in SearchCriteriaBuilder, please use buildArray");
        }

        /*
            Use this method for criteria chaining
         */
        public SearchCriteria[] buildArray() {
            if (searchCriteriaList.isEmpty()) {
                searchCriteriaList.add(new SearchCriteria(this.object, this.operation, this.value, this.secondValue, this.joinOperator));
            }
            return searchCriteriaList.toArray(SearchCriteria[]::new);
        }
    }
}
