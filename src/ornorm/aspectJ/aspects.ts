import {
    Project,
    StructureKind,
    Scope,
    ClassDeclaration,
    SourceFile
} from 'ts-morph';

/*
Aspects

aspect A { … }
    defines the aspect A
privileged aspect A { … }
    A can access private fields and methods
aspect A extends B implements I, J { … }
    B is a class or abstract aspect, I and J are interfaces
aspect A percflow( call(void Foo.m()) ) { … }
    an instance of A is instantiated for every control flow through
    calls to m()

general form:
    [ privileged ] [ Modifiers ] aspect Id
        [ extends Type ] [ implements TypeList ] [ PerClause ]
            { Body }

where PerClause is one of
    pertarget ( Pointcut )
    perthis ( Pointcut )
    percflow ( Pointcut )
    percflowbelow ( Pointcut )
    pertypewithin( TypePattern )
    issingleton ()
 */

/*
Inter-type Member Declarations in aspects
int Foo . m ( int i ) { ... }
    a method int m(int) owned by Foo, visible anywhere in the
    defining package. In the body, this refers to the instance of Foo,
    not the aspect.
private int Foo . m ( int i ) throws IOException { ... }
    a method int m(int) that is declared to throw IOException, only
    visible in the defining aspect. In the body, this refers to the
    instance of Foo, not the aspect.
abstract int Foo . m ( int i ) ;
    an abstract method int m(int) owned by Foo
Point . new ( int x, int y ) { ... }
    a constructor owned by Point. In the body, this refers to the new
    Point, not the aspect.
private static int Point . x ;
    a static int field named x owned by Point and visible only in the
    declaring aspect
private int Point . x = foo() ;
    a non-static field initialized to the result of calling foo(). In the
    initializer, this refers to the instance of Foo, not the aspect.

general form:
    [ Modifiers ] Type Type . Id ( Formals )
        [ throws TypeList ] { Body }
    abstract [ Modifiers ] Type Type . Id ( Formals )
        [ throws TypeList ] ;
    [ Modifiers ] Type . new ( Formals )
        [ throws TypeList ] { Body }
    [ Modifiers ] Type Type . Id [ = Expression ] ;
 */

// Create a new project using ts-morph
const project: Project = new Project();
// Add a new source file named Aspects.ts
const sourceFile: SourceFile = project.createSourceFile('Aspects.ts', '', { overwrite: true });

/**
 * Creates an aspect class with the specified properties.
 * @param name - The name of the aspect class.
 * @param isPrivileged - Indicates if the aspect is privileged (can access private fields and methods).
 * @param extendsClass - The class that this aspect extends (if any).
 * @param implementsInterfaces - The interfaces that this aspect implements (if any).
 * @param perClause - The PerClause definition for the aspect (if any).
 * @returns The created aspect class.
 * @see ClassDeclaration
 */
export function createAspectClass(
    name: string,
    isPrivileged: boolean,
    extendsClass?: string,
    implementsInterfaces?: string[],
    perClause?: string
): ClassDeclaration {
    // Add a class declaration to the source file
    const aspectClass: ClassDeclaration = sourceFile.addClass({
        name: name,
        isAbstract: false,
        decorators: [
            {
                name: 'Aspect',
                arguments: [],
                kind: StructureKind.Decorator
            }
        ],
        extends: extendsClass,
        implements: implementsInterfaces,
        kind: StructureKind.Class
    });

    // If the aspect is privileged, add private fields and methods
    if (isPrivileged) {
        aspectClass.addProperty({
            name: 'privateField',
            type: 'string',
            scope: Scope.Private,
        });

        aspectClass.addMethod({
            name: 'privateMethod',
            statements: [`console.log('Private method executed');`],
            scope: Scope.Private,
        });
    }

    // Add a public method named advice
    aspectClass.addMethod({
        name: 'advice',
        statements: [`console.log('Advice executed');`],
        returnType: 'void',
    });

    // If a PerClause is specified, add it as a decorator
    if (perClause) {
        aspectClass.addDecorator({
            name: 'PerClause',
            arguments: [perClause],
            kind: StructureKind.Decorator
        });
    }

    return aspectClass;
}

// Example of creating aspects with various PerClause definitions
createAspectClass('PertargetAspect', true, undefined, undefined, 'pertarget(call(void Foo.m()))');
createAspectClass('PerthisAspect', false, undefined, undefined, 'perthis(call(void Foo.m()))');
createAspectClass('PercflowAspect', false, undefined, undefined, 'percflow(call(void Foo.m()))');
createAspectClass('PercflowbelowAspect', false, undefined, undefined, 'percflowbelow(call(void Foo.m()))');
createAspectClass('PertypewithinAspect', false, undefined, undefined, 'pertypewithin(Foo)');
createAspectClass('IssingletonAspect', false, undefined, undefined, 'issingleton()');

// Save the source file
project.save().then(() => {
    console.log('Aspects.ts has been created with various PerClause definitions');
});
