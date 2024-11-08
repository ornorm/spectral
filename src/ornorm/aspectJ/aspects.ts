import {
    Project,
    StructureKind,
    ClassDeclaration,
    SourceFile,
    MethodDeclarationStructure,
    ConstructorDeclarationStructure,
    PropertyDeclarationStructure,
    Scope
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
/*
Other Inter-type Declarations in aspects
declare parents : C extends D;
    declares that the superclass of C is D. This is only legal if D is
    declared to extend the original superclass of C.
declare parents : C implements I, J ;
    C implements I and J
declare warning : set(* Point.*) && !within(Point) : “bad set” ;
    the compiler warns “bad set” if it finds a set to any field of
    Point outside of the code for Point
declare error : call(Singleton.new(..)) : “bad construction” ;
    the compiler signals an error “bad construction” if it finds a call
    to any constructor of Singleton
declare soft : IOException : execution(Foo.new(..));
    any IOException thrown from executions of the constructors of
    Foo are wrapped in org.aspectj.SoftException
declare precedence : Security, Logging, * ;
    at each join point, advice from Security has precedence over
    advice from Logging, which has precedence over other advice.
declare @type: C : @SomeAnnotation;
    declares the annotation “@SomeAnnotation” on the type C.
declare @method: * C.foo*(..) : @SomeAnnotation;
    declares the annotation “@SomeAnnotation” on all methods
    declared in C starting with “foo”.
declare @constructor: C.new(..) : @SomeAnnotation;
    declares the annotation “@SomeAnnotation” on all constructors
    declared in C.
declare @field: * C.* : @SomeAnnotation;
    declares the annotation “@SomeAnnotation” on all fields
    declared in C.
general form
    declare parents : TypePat extends Type ;
    declare parents : TypePat implements TypeList ;
    declare warning : Pointcut : String ;
    declare error : Pointcut : String ;
    declare soft : Type : Pointcut ;
    declare precedence : TypePatList ;
    declare @type : TypePat : Annotation;
    declare @method: MethodPat : Annotation;
    declare @constructor: ConstructorPat : Annotation;
    declare @field : FieldPat : Annotation;
 */

/**
 * Type alias for an abstract method form.
 * Represents an abstract method that takes a value of type T and returns a value of type R.
 *
 * @template T - The type of the input value.
 * @template R - The type of the return value.
 */
export type AbstractMethodForm<T = any, R = any> = abstract new (value: T) => R;

/**
 * Type alias for a constructor form.
 * Represents a constructor that takes a variable number of arguments of type T and returns an instance of type T.
 *
 * @template T - The type of the constructor arguments and the return value.
 */
export type ConstructorForm<T = any> = new (...args: T[]) => T;

/**
 * Type alias for a method form.
 * Represents a method that takes a value of type T and returns a value of type R.
 *
 * @template T - The type of the input value.
 * @template R - The type of the return value.
 */
export type MethodForm<T = any, R = any> = (value: T) => R;

/**
 * Type alias for a property form.
 * Represents a property of type T.
 *
 * @template T - The type of the property.
 */
export type PropertyForm<T = any> = T;

/**
 * Type alias for an array of member declarations.
 * Represents an array that can contain method, constructor, or property declarations.
 * @see MethodDeclarationStructure
 * @see ConstructorDeclarationStructure
 * @see PropertyDeclarationStructure
 */
export type MemberDeclarationsArray = Array<MethodDeclarationStructure | ConstructorDeclarationStructure | PropertyDeclarationStructure>;

/**
 * Declares that the superclass of a given class is another class.
 *
 * @param className - The name of the class whose superclass is being declared.
 * @param superClassName - The name of the superclass.
 *
 * @example
 * declareParentsExtends('C', 'D');
 */
export function declareParentsExtends(aspectClass: ClassDeclaration, className: string, superClassName: string): void {
    aspectClass.addMethod({
        name: 'declareParentsExtends',
        statements: [`console.log('declare parents : ${className} extends ${superClassName};');`],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Declares that a given class implements one or more interfaces.
 *
 * @param className - The name of the class.
 * @param interfaces - The interfaces that the class implements.
 *
 * @example
 * declareParentsImplements('C', ['I', 'J']);
 */
export function declareParentsImplements(aspectClass: ClassDeclaration, className: string, interfaces: string[]): void {
    aspectClass.addMethod({
        name: 'declareParentsImplements',
        statements: [`console.log('declare parents : ${className} implements ${interfaces.join(', ')};');`],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Declares a compiler warning for a specified pointcut.
 *
 * @param pointcut - The pointcut at which the warning should be issued.
 * @param message - The warning message.
 *
 * @example
 * declareWarning('set(* Point.*) && !within(Point)', 'bad set');
 */
export function declareWarning(aspectClass: ClassDeclaration, pointcut: string, message: string): void {
    aspectClass.addMethod({
        name: 'declareWarning',
        statements: [`console.log('declare warning : ${pointcut} : "${message}";');`],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Declares a compiler error for a specified pointcut.
 *
 * @param pointcut - The pointcut at which the error should be issued.
 * @param message - The error message.
 *
 * @example
 * declareError('call(Singleton.new(..))', 'bad construction');
 */
export function declareError(aspectClass: ClassDeclaration, pointcut: string, message: string): void {
    aspectClass.addMethod({
        name: 'declareError',
        statements: [`console.log('declare error : ${pointcut} : "${message}";');`],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Declares that any exceptions of a specified type thrown from a pointcut
 * should be wrapped in a soft exception.
 *
 * @param exceptionType - The type of exception.
 * @param pointcut - The pointcut at which the exception should be wrapped.
 *
 * @example
 * declareSoft('IOException', 'execution(Foo.new(..))');
 */
export function declareSoft(aspectClass: ClassDeclaration, exceptionType: string, pointcut: string): void {
    aspectClass.addMethod({
        name: 'declareSoft',
        statements: [`console.log('declare soft : ${exceptionType} : ${pointcut};');`],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Declares the precedence of aspects at each join point.
 *
 * @param aspects - The list of aspects in order of precedence.
 *
 * @example
 * declarePrecedence(['Security', 'Logging', '*']);
 */
export function declarePrecedence(aspectClass: ClassDeclaration, aspects: string[]): void {
    aspectClass.addMethod({
        name: 'declarePrecedence',
        statements: [`console.log('declare precedence : ${aspects.join(', ')};');`],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Declares an annotation on a specified type.
 *
 * @param type - The type to be annotated.
 * @param annotation - The annotation to be declared.
 *
 * @example
 * declareTypeAnnotation('C', '@SomeAnnotation');
 */
export function declareTypeAnnotation(aspectClass: ClassDeclaration, type: string, annotation: string): void {
    aspectClass.addMethod({
        name: 'declareTypeAnnotation',
        statements: [`console.log('declare @type: ${type} : ${annotation};');`],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Declares an annotation on all methods matching a specified pattern.
 *
 * @param methodPattern - The method pattern to be annotated.
 * @param annotation - The annotation to be declared.
 *
 * @example
 * declareMethodAnnotation('* C.foo*(..)', '@SomeAnnotation');
 */
export function declareMethodAnnotation(aspectClass: ClassDeclaration, methodPattern: string, annotation: string): void {
    aspectClass.addMethod({
        name: 'declareMethodAnnotation',
        statements: [`console.log('declare @method: ${methodPattern} : ${annotation};');`],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Declares an annotation on all constructors matching a specified pattern.
 *
 * @param constructorPattern - The constructor pattern to be annotated.
 * @param annotation - The annotation to be declared.
 *
 * @example
 * declareConstructorAnnotation('C.new(..)', '@SomeAnnotation');
 */
export function declareConstructorAnnotation(aspectClass: ClassDeclaration, constructorPattern: string, annotation: string): void {
    aspectClass.addMethod({
        name: 'declareConstructorAnnotation',
        statements: [`console.log('declare @constructor: ${constructorPattern} : ${annotation};');`],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Declares an annotation on all fields matching a specified pattern.
 *
 * @param fieldPattern - The field pattern to be annotated.
 * @param annotation - The annotation to be declared.
 *
 * @example
 * declareFieldAnnotation('* C.*', '@SomeAnnotation');
 */
export function declareFieldAnnotation(aspectClass: ClassDeclaration, fieldPattern: string, annotation: string): void {
    aspectClass.addMethod({
        name: 'declareFieldAnnotation',
        statements: [`console.log('declare @field: ${fieldPattern} : ${annotation};');`],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

// Create a new project using ts-morph
const project: Project = new Project();
// Add a new source file named Aspects.ts
const sourceFile: SourceFile = project.createSourceFile('Aspects.ts', '', { overwrite: true });

/**
 * Validates and adds general `inter-type` forms to the aspect class.
 * @param aspectClass - The aspect class to which the `inter-type`
 * forms are added.
 * @param members - The array of member declarations (methods,
 * constructors, and fields) to add to the aspect.
 * @see MemberDeclarationsArray
 */
export function addInterTypeMember(aspectClass: ClassDeclaration, members: MemberDeclarationsArray): void {
    for (const member of members) {
        if (member.kind === StructureKind.Method) {
            if (typeof member.returnType === 'string' && member.returnType !== 'void' && (member.parameters?.length || 0) > 0) {
                aspectClass.addMethod(member as MethodDeclarationStructure);
            } else if (typeof member.returnType === 'string' && member.isAbstract) {
                aspectClass.addMethod(member as MethodDeclarationStructure);
            }
        } else if (member.kind === StructureKind.Constructor) {
            if ((member.parameters?.length || 0) > 0) {
                aspectClass.addConstructor(member as ConstructorDeclarationStructure);
            }
        } else if (member.kind === StructureKind.Property) {
            if (typeof member.initializer === 'string' || typeof member.type === 'string') {
                aspectClass.addProperty(member as PropertyDeclarationStructure);
            }
        }
    }
}

/**
 * Creates an aspect class with the specified properties and `inter-type`
 * member declarations.
 * @param name - The name of the aspect class.
 * @param isPrivileged - Indicates if the aspect is privileged (can access
 * private fields and methods).
 * @param extendsClass - The class that this aspect extends (if any).
 * @param implementsInterfaces - The interfaces that this aspect
 * implements (if any).
 * @param perClause - The PerClause definition for the aspect (if any).
 * @param members - The array of member declarations (methods,
 * constructors, and fields) to add to the aspect.
 * @returns The created aspect class.
 * @see ClassDeclaration
 * @see MemberDeclarationsArray
 */
export function createAspectClass(name: string, isPrivileged: boolean, extendsClass?: string, implementsInterfaces?: Array<string>, perClause?: string, members?: MemberDeclarationsArray): ClassDeclaration {
    const aspectClass: ClassDeclaration = sourceFile.addClass({
        name: name,
        isAbstract: false,
        decorators: [{ name: 'Aspect', arguments: [], kind: StructureKind.Decorator }],
        extends: extendsClass,
        implements: implementsInterfaces,
        kind: StructureKind.Class
    });

    if (isPrivileged) {
        aspectClass.addProperty({ name: 'privateField', type: 'string', scope: Scope.Private });
        aspectClass.addMethod({ name: 'privateMethod', statements: [`console.log('Private method executed');`], scope: Scope.Private });
    }

    aspectClass.addMethod({ name: 'advice', statements: [`console.log('Advice executed');`], returnType: 'void' });

    if (perClause) {
        aspectClass.addDecorator({ name: 'PerClause', arguments: [perClause], kind: StructureKind.Decorator });
    }

    if (members) {
        addInterTypeMember(aspectClass, members);
    }

    return aspectClass;
}

// Example usage
const exampleClass: ClassDeclaration = sourceFile.addClass({ name: 'ExampleAspect', isAbstract: false, kind: StructureKind.Class });
declareParentsExtends(exampleClass, 'C', 'D');
declareParentsImplements(exampleClass, 'C', ['I', 'J']);
declareWarning(exampleClass, 'set(* Point.*) && !within(Point)', 'bad set');
declareError(exampleClass, 'call(Singleton.new(..))', 'bad construction');
declareSoft(exampleClass, 'IOException', 'execution(Foo.new(..))');
declarePrecedence(exampleClass, ['Security', 'Logging', '*']);
declareTypeAnnotation(exampleClass, 'C', '@SomeAnnotation');
declareMethodAnnotation(exampleClass, '* C.foo*(..)', '@SomeAnnotation');
declareConstructorAnnotation(exampleClass, 'C.new(..)', '@SomeAnnotation');
declareFieldAnnotation(exampleClass, '* C.*', '@SomeAnnotation');

const members: MemberDeclarationsArray = [
    { kind: StructureKind.Method, name: 'exampleMethod', returnType: 'void', parameters: [] },
    { kind: StructureKind.Constructor, parameters: [] },
    { kind: StructureKind.Property, name: 'exampleProperty', type: 'string', initializer: `'example'` }
];
addInterTypeMember(exampleClass, members);

createAspectClass('ExampleAspectClass', true, 'SuperClass', ['Interface1', 'Interface2'], 'perthis(call(void Foo.m()))', members);

// Save the source file
project.save().then(() => {
    console.log('Aspects.ts has been updated with new functions and examples');
});
