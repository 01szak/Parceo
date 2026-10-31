package pl.parceo.exception;

public class DateValidationException extends UserInputException{

    public DateValidationException(String message) {
        super(message);
    }

    public static void checkClientInput(boolean condition, String errorMessage) {
        if (condition) {
            throw new DateValidationException(errorMessage);
        }
    }
}
