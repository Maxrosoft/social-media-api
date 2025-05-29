import passwordValidator from "password-validator";

const passwordValidationSchema = new passwordValidator();

passwordValidationSchema
    .is().min(8)
    .is().max(100)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().not().spaces();

export default passwordValidationSchema;