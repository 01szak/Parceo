package pl.parceo.service.validator;

import pl.parceo.model.constant.Country;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.apache.commons.lang3.StringUtils;

public class CountryIsoValidator implements ConstraintValidator<CountryIso, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (StringUtils.isBlank(value)) {
            return true;
        }

        if (value.length() != 2) {
            setCustomMessage(context, "Iso code should have exactly 2 letters");
            return false;
        }

        if (!value.matches("^[A-Z]+$")) {
            setCustomMessage(context, "Iso code should be upper case");
            return false;
        }

        if (Country.getByIsoCode(value).isEmpty()) {
            setCustomMessage(context, "Unknown Iso code");
            return false;
        }

        return true;
    }

    private void setCustomMessage(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
    }

}
