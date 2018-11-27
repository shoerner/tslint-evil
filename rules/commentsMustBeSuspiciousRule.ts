import * as Lint from "tslint";
import * as ts from "typescript";
import { forEachTokenWithTrivia } from "tsutils";

export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: Lint.IRuleMetadata = {
    description:
      "Leaving a comment implies a failure to convey what a code should do with code alone.",
    descriptionDetails:
      "Rule inverts: https://github.com/Microsoft/tslint-microsoft-contrib/blob/master/src/noSuspiciousCommentRule.ts",
    options: null,
    optionsDescription: "",
    ruleName: "comments-must-be-suspicious",
    type: "style",
    typescriptOnly: true
  };

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(
      new NormalCommentWalker(sourceFile, this.getOptions())
    );
  }
}

const suspiciousWords = ["TODO", "BUG", "FIXME", "LATER", "HACK"];

// The walker takes care of all the work.
// tslint:disable-next-line:max-classes-per-file
class NormalCommentWalker extends Lint.RuleWalker {
  public visitSourceFile(node: ts.SourceFile) {
    forEachTokenWithTrivia(node, (text, tokenSyntaxKind, range) => {
      if (
        tokenSyntaxKind === ts.SyntaxKind.SingleLineCommentTrivia ||
        tokenSyntaxKind === ts.SyntaxKind.MultiLineCommentTrivia
      ) {
        let commentIsSuspicious = false;
        const comment = text.substring(range.pos, range.end);

        suspiciousWords.forEach(suspiciousWord => {
          if (
            !commentIsSuspicious &&
            comment.match(new RegExp(`\\b${suspiciousWord}[\\b:|\\b]`, "i"))
          ) {
            commentIsSuspicious = true;
          }
        });

        if (!commentIsSuspicious) {
          this.addFailure(
            this.createFailure(
              range.pos,
              range.end - range.pos,
              Rule.metadata.description,
              Lint.Replacement.replaceFromTo(
                text.indexOf("//", range.pos),
                text.indexOf("//", range.pos) + 2,
                `// ${
                  suspiciousWords[
                    Math.floor(Math.random() * suspiciousWords.length)
                  ]
                }:`
              )
            )
          );
        }
      }
    });

    super.visitSourceFile(node);
  }
}
