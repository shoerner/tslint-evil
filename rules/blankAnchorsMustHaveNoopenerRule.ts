import * as Lint from "tslint";
import * as ts from "typescript";

export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: Lint.IRuleMetadata = {
    description:
      "Anchors targeting '_blank' must have 'rel=\"noopener\"' set to prevent security issues",
    options: null,
    optionsDescription: "",
    ruleName: "blank-anchors-must-have-noopener",
    type: "functionality",
    typescriptOnly: true
  };

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(
      new AnchorWalker(sourceFile, this.getOptions())
    );
  }
}

class AnchorWalker extends Lint.RuleWalker {
  public visitJsxElement(node: ts.JsxElement) {
    if (
      ts.isJsxOpeningElement(node.openingElement) &&
      node.openingElement.tagName.getText() === "a"
    ) {
      if (
        this.anchorBlanksWithoutNoopener(
          node.openingElement.attributes.properties
        )
      ) {
        this.addFailure(
          this.createFailure(
            node.getStart(),
            node.getWidth(),
            Rule.metadata.description
          )
        );
      }
    }

    super.visitJsxElement(node);
  }

  public visitJsxSelfClosingElement(node: ts.JsxSelfClosingElement) {
    if (node.tagName.getText() === "a") {
      if (this.anchorBlanksWithoutNoopener(node.attributes.properties)) {
        this.addFailure(
          this.createFailure(
            node.getStart(),
            node.getWidth(),
            Rule.metadata.description
          )
        );
      }
    }

    super.visitJsxSelfClosingElement(node);
  }

  private anchorBlanksWithoutNoopener(
    attributes: ts.NodeArray<ts.JsxAttributeLike>
  ) {
    const targetsBlank = !!attributes.find(element => {
      if (
        ts.isJsxAttribute(element) &&
        element.name &&
        ts.isIdentifier(element.name) &&
        element.name.getText() === "target"
      ) {
        return !!(
          element.initializer &&
          ts.isStringLiteral(element.initializer) &&
          element.initializer.getText() === '"_blank"'
        );
      }
      return false;
    });

    const hasRelLink = !!attributes.find(element => {
      if (
        ts.isJsxAttribute(element) &&
        element.name &&
        ts.isIdentifier(element.name) &&
        element.name.getText() === "rel"
      ) {
        return !!(
          element.initializer && element.initializer.getText() === '"noopener"'
        );
      }
      return false;
    });

    return targetsBlank && !hasRelLink;
  }
}
