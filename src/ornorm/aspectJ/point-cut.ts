import {
    Project,
    StructureKind,
    Scope,
    MethodDeclarationStructure,
    SourceFile, FunctionDeclarationStructure
} from 'ts-morph';

/*
Pointcut Definitions

private pointcut pc() : call(void Foo.m()) ;
    a pointcut visible only from the defining type
pointcut pc(int i) : set(int Foo.x) && args(i) ;
    a package-visible pointcut that exposes an int.
public abstract pointcut pc() ;
    an abstract pointcut that can be referred to from anywhere.
abstract pointcut pc(Object o) ;
    an abstract pointcut visible from the defining package. Any
    pointcut that implements this must expose an Object.
general form:
    abstract [Modifiers] pointcut Id ( Formals ) ;
    [Modifiers] pointcut Id ( Formals ) : Pointcut ;
*/

// Create a new project using ts-morph
const project: Project = new Project();
// Add a new source file named PointCut.ts
const sourceFile: SourceFile = project.createSourceFile('point-cut.ts', '', { overwrite: true });

/**
 * Creates a pointcut definition function.
 * @param name - The name of the pointcut.
 * @param visibility - The visibility of the pointcut (private, package, public, abstract).
 * @param formals - The formal parameters of the pointcut.
 * @param pointcut - The pointcut expression.
 * @returns The created pointcut function.
 */
export function createPointcut(
    name: string,
    visibility: 'private' | 'package' | 'public' | 'abstract',
    formals: string,
    pointcut: string
): FunctionDeclarationStructure {
    return {
        name: name,
        parameters: formals ? formals.split(',').map(param => ({ name: param.trim() })) : [],
        statements: [],
        returnType: 'void',
        isExported: visibility === 'public',
        isAbstract: visibility === 'abstract',
        decorators: [
            {
                name: 'Pointcut',
                arguments: [pointcut],
                kind: StructureKind.Decorator
            }
        ],
        kind: StructureKind.Function
    };
}

// Add pointcut definitions to the source file
sourceFile.addFunction(createPointcut('pc', 'private', '', 'call(void Foo.m())'));
sourceFile.addFunction(createPointcut('pc', 'package', 'int i', 'set(int Foo.x) && args(i)'));
sourceFile.addFunction(createPointcut('pc', 'public', '', ''));
sourceFile.addFunction(createPointcut('pc', 'abstract', 'Object o', ''));

// Save the source file
project.save().then(() => {
    console.log('point-cut.ts has been updated with pointcut definitions');
});
