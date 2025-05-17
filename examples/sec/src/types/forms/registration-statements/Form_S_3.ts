import { Form } from "../Form";

export class Form_S_3 extends Form {
  static readonly name = "Registration Statement (S-3)";
  static readonly description =
    "This filing is the most simplified registration form and it may only be used by companies which have reported under the '34 Act for a minimum of twelve months and meet the timely filing requirements set forth under Form S-2. The filing company must also meet the stringent qualitative tests prescribed by the form.";
  static readonly forms = ["S-3", "S-3/A", "S-3MEF"] as const;
}
