import * as Lint from "tslint";
import * as ts from "typescript";

export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: Lint.IRuleMetadata = {
    description: "All classNames must be emojis. Suggestions: 🙃 🤖 👻",
    options: null,
    optionsDescription: "",
    ruleName: "classnames-must-be-emojis",
    type: "style",
    typescriptOnly: true
  };

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(
      new ClassNameWalker(sourceFile, this.getOptions())
    );
  }
}

const allowedNames =
  "\ud83c[\udf00=udfff]|\ud83d[\udc00-\ude4f]|\ud83d[\ude80-\udeff]";

// The walker takes care of all the work.
// tslint:disable-next-line:max-classes-per-file
class ClassNameWalker extends Lint.RuleWalker {
  public visitJsxAttribute(nodeAttribute: ts.JsxAttribute) {
    const nodeName = nodeAttribute.name.text;
    if (
      nodeName === "className" &&
      nodeAttribute.initializer &&
      ts.isJsxExpression(nodeAttribute.initializer)
    ) {
      const cssPreprocessor = nodeAttribute.initializer.expression;
      // Match on Aphrodite css() declarations
      if (
        cssPreprocessor &&
        ts.isCallExpression(cssPreprocessor) &&
        ts.isIdentifier(cssPreprocessor.expression) &&
        cssPreprocessor.expression.text === "css"
      ) {
        cssPreprocessor.arguments.forEach(arg => {
          if (
            ts.isPropertyAccessExpression(arg) &&
            !arg.name.text.match(allowedNames)
          ) {
            this.addFailure(
              this.createFailure(
                arg.name.getStart(),
                arg.name.getWidth(),
                Rule.metadata.description
              )
            );
          }
        });
      } else if (
        cssPreprocessor &&
        ts.isStringLiteral(cssPreprocessor) &&
        !cssPreprocessor.text.match(allowedNames)
      ) {
        this.addFailure(
          this.createFailure(
            cssPreprocessor.getStart(),
            cssPreprocessor.getWidth(),
            Rule.metadata.description
          )
        );
      }
      //TODO: add implementation for TemplateExpression
    }
    // call the base version of this visitor to actually parse this node
    super.visitJsxAttribute(nodeAttribute);
  }
}
