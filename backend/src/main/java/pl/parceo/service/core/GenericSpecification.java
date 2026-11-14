package pl.parceo.service.core;

import jakarta.persistence.criteria.From;
import pl.parceo.exception.ClientSideException;
import pl.parceo.exception.UnsupportedSqlOperationException;
import pl.parceo.exception.UserInputException;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.validation.constraints.NotNull;
import org.hibernate.query.sqm.PathElementException;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Optional;

public record GenericSpecification<S>(@NotNull SearchCriteria searchCriteria) implements Specification<S> {

    @Override
    public @Nullable Predicate toPredicate(
            @NonNull Root<S> root,
            @NonNull CriteriaQuery<?> query,
            @NonNull CriteriaBuilder criteriaBuilder
    ) {
        try {

            final var key = (Expression) getNestedKey(root, searchCriteria.getObject());

            final var javaType = key.getJavaType();
            final var value = parseValue(javaType, searchCriteria.getValue());
            final var secondValue = Optional.ofNullable(searchCriteria.getSecondValue())
                    .map(_ -> parseValue(javaType, searchCriteria.getSecondValue()))
                    .orElse(null);

            switch (searchCriteria.getOperation()) {
                case EQUALS -> {
                    return criteriaBuilder.equal(key, value);
                }
                case NOT_EQUALS -> {
                    return criteriaBuilder.notEqual(key, value);
                }
                case LIKE -> {
                    return criteriaBuilder.like(criteriaBuilder.lower(key.as(String.class)), "%" + value.toString().toLowerCase() + "%");
                }
                case LESS_THEN -> {
                    return criteriaBuilder.lessThan((Expression<? extends Comparable>) key, (Comparable) value);
                }
                case GREATER_THEN -> {
                    return criteriaBuilder.greaterThan((Expression<? extends Comparable>) key, (Comparable) value);
                }
                case BETWEEN -> {
                    if (secondValue == null) {
                        throw new ClientSideException("second values cannot be null while using between operation");
                    }
                    return criteriaBuilder.between(
                            (Expression<? extends Comparable>) key,
                            (Comparable) value,
                            (Comparable) secondValue
                    );
                }
                default -> {
                    //should never happen
                    throw new UnsupportedSqlOperationException();
                }
            }
        } catch (PathElementException e) {
            throw new ClientSideException(e.getLocalizedMessage());
        }
    }

    private Object parseValue(Class javaType, String value) {
        try {
            if (value == null) {
                return null;
            } else if (LocalDateTime.class.isAssignableFrom(javaType)) {
                return LocalDateTime.parse(value);
            } else if (LocalDate.class.isAssignableFrom(javaType)) {
                return LocalDate.parse(value);
            } else if (BigDecimal.class.isAssignableFrom(javaType)) {
                return new BigDecimal(value);
            } else if (Integer.class.isAssignableFrom(javaType)||int.class.isAssignableFrom(javaType) ) {
                return Integer.parseInt(value);
            } else if (Long.class.isAssignableFrom(javaType)||long.class.isAssignableFrom(javaType)) {
                return Long.parseLong(value);
            } else if (Boolean.class.isAssignableFrom(javaType)||boolean.class.isAssignableFrom(javaType)) {
                return Boolean.valueOf(value);
            } else if (Enum.class.isAssignableFrom(javaType)) {
                return Enum.valueOf((Class<? extends Enum>) javaType, value);
            } else  {
                return value;
            }
        } catch (DateTimeParseException e) {
            throw new UserInputException("Nieprawidłowa data!");
        } catch (IllegalArgumentException e) {
            throw new UserInputException("Nieprawidłowa wartość filtra: " + value);
        }
    }

    public Expression<S> getNestedKey(Root<S> root, SearchCriteria.Join object) {
        From<?, ?> current = root;
        while (object != null) {
            if (object.inner() == null) {
                return current.get(object.key());
            }
            current = current.join(object.key());
            object = object.inner();
        }
        return (Expression<S>) current;
    }
}
