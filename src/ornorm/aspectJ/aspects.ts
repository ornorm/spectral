import {
    Project,
    StructureKind,
    Scope,
    ClassDeclaration,
    PropertyDeclarationStructure,
    MethodDeclarationStructure,
    DecoratorStructure,
    SourceFile
} from 'ts-morph';

// Create a new project
const project: Project = new Project();
// Add a source file
const sourceFile: SourceFile = project.createSourceFile("Aspects.ts", "", { overwrite: true });

export function createAspectClass(
    name: string,
    isPrivileged: boolean,
    extendsClass?: string,
    implementsInterfaces?: string[],
    perClause?: string
): ClassDeclaration {
    const aspectClass: ClassDeclaration = sourceFile.addClass({
        name: name,
        isAbstract: false,
        decorators: [
            {
                name: "Aspect",
                arguments: [],
                kind: StructureKind.Decorator
            } as DecoratorStructure
        ],
        extends: extendsClass,
        implements: implementsInterfaces,
        kind: StructureKind.Class
    });
    if (isPrivileged) {
        aspectClass.addProperty({
            name: "privateField",
            type: "string",
            scope: Scope.Private,
        } as PropertyDeclarationStructure);

        aspectClass.addMethod({
            name: "privateMethod",
            statements: [
                "console.log('Private method executed');"
            ],
            scope: Scope.Private,
        } as MethodDeclarationStructure);
    }

    aspectClass.addMethod({
        name: "advice",
        statements: [
            "console.log('Advice executed');"
        ],
        returnType: "void",
    } as MethodDeclarationStructure);

    if (perClause) {
        aspectClass.addDecorator({
            name: "PerClause",
            arguments: [perClause],
            kind: StructureKind.Decorator
        } as DecoratorStructure);
    }

    return aspectClass;
}

// Example of creating aspects
createAspectClass("ExampleAspect", true, "BaseClass", ["AdviceInterface"], "percflow(call(void Foo.m()))");

// Save the source file
project.save().then(() => {
    console.log("Aspects.ts has been created");
});
