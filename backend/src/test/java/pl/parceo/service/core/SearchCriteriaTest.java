package pl.parceo.service.core;

import org.junit.jupiter.api.Test;
import pl.parceo.model.constant.JoinOperator;
import pl.parceo.model.constant.Operation;

import static org.assertj.core.api.Assertions.assertThat;

public class SearchCriteriaTest {

    @Test
    public void shouldReturnSingleCriterionWhenNotChained() {
        // When
        final var result = SearchCriteria.builder()
                .object(new SearchCriteria.Join("firstname"))
                .operation(Operation.EQUALS)
                .value("Jan")
                .buildArray();

        // Then
        assertThat(result).hasSize(1);
        assertThat(result[0].getObject().key()).isEqualTo("firstname");
        assertThat(result[0].getValue()).isEqualTo("Jan");
    }

    @Test
    public void shouldKeepBothCriteriaWhenChainedWithAnd() {
        // When
        final var result = SearchCriteria.builder()
                .object(new SearchCriteria.Join("firstname"))
                .operation(Operation.EQUALS)
                .value("Jan")
                .and()
                .object(new SearchCriteria.Join("lastname"))
                .operation(Operation.EQUALS)
                .value("Kowalski")
                .buildArray();

        // Then - regression check: buildArray() used to silently drop the last
        // chained criterion ('lastname'='Kowalski') whenever the chain had any and()/or()
        assertThat(result)
                .withFailMessage("buildArray() dropped the last chained criterion ('lastname'='Kowalski')")
                .hasSize(2);
        assertThat(result[0].getObject().key()).isEqualTo("firstname");
        assertThat(result[0].getValue()).isEqualTo("Jan");
        assertThat(result[1].getObject().key()).isEqualTo("lastname");
        assertThat(result[1].getValue()).isEqualTo("Kowalski");
    }

    @Test
    public void shouldKeepAllCriteriaWhenChainedMultipleTimes() {
        // When
        final var result = SearchCriteria.builder()
                .object(new SearchCriteria.Join("firstname"))
                .operation(Operation.EQUALS)
                .value("Jan")
                .and()
                .object(new SearchCriteria.Join("lastname"))
                .operation(Operation.EQUALS)
                .value("Kowalski")
                .or()
                .object(new SearchCriteria.Join("country"))
                .operation(Operation.EQUALS)
                .value("PL")
                .buildArray();

        // Then
        assertThat(result)
                .withFailMessage("buildArray() should keep every criterion in a 3-way chain, not just the first two")
                .hasSize(3);
        assertThat(result[0].getObject().key()).isEqualTo("firstname");
        assertThat(result[1].getObject().key()).isEqualTo("lastname");
        assertThat(result[2].getObject().key()).isEqualTo("country");
        assertThat(result[2].getValue()).isEqualTo("PL");
        assertThat(result[2].getJoinOperator()).isEqualTo(JoinOperator.OR);
    }
}
