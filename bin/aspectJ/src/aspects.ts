import {
    Project,
    StructureKind,
    ClassDeclaration,
    SourceFile,
    MethodDeclarationStructure,
    ConstructorDeclarationStructure,
    PropertyDeclarationStructure,
    Scope, ExpressionWithTypeArguments
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
    defining package.
    In the body, this refers to the instance of Foo, not the aspect.
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

/*
Primitive Pointcuts

call ( void Foo.m(int) )
    a call to the method void Foo.m(int)
call ( Foo.new(..) )
    a call to any constructor of Foo
execution ( * Foo.*(..) throws IOException )
    the execution of any method of Foo that is declared to throw
    IOException
execution ( !public Foo .new(..) )
    the execution of any non-public constructor of Foo
initialization ( Foo.new(int) )
    the initialization of any Foo object that is started with the
    constructor Foo(int)
preinitialization ( Foo.new(int) )
    the pre-initialization (before the super constructor is called) that
    is started with the constructor Foo(int)
staticinitialization( Foo )
    when the type Foo is initialized, after loading
get ( int Point.x )
    when int Point.x is read
set ( !private * Point.* )
    when any non-private field of Point is assigned
handler ( IOException+ )
    when an IOException or its subtype is handled with a catch block
adviceexecution()
    the execution of all advice bodies
within ( com.bigboxco.* )
    any join point where the associated code is defined in the
    package com.bigboxco
withincode ( void Figure.move() )
    any join point where the associated code is defined in the method
    void Figure.move()
withincode ( com.bigboxco.*.new(..) )
    any join point where the associated code is defined in any
    constructor in the package com.bigoxco.
cflow ( call(void Figure.move()) )
    any join point in the control flow of each call to void
    Figure.move(). This includes the call itself.
cflowbelow ( call(void Figure.move()) )
    any join point below the control flow of each call to void
    Figure.move(). This does not include the call.
if ( Tracing.isEnabled() )
    any join point where Tracing.isEnabled() is true. The boolean
    expression used can only access static members, variables bound
    in the same pointcut, and thisJoinPoint forms.
this ( Point )
    any join point where the currently executing object is an instance
    of Point
target ( java.io.InputPort )
    any join point where the target object is an instance of
    java.io.InputPort
args ( java.io.InputPort, int )
    any join point where there are two arguments, the first an
    instance of java.io.InputPort, and the second an int
args ( *, int )
    any join point where there are two arguments, the second of
    which is an int.
args ( short, .., short )
    any join point with at least two arguments, the first and last of
    which are shorts
    Note: any position in this, target, and args can be replaced with a
    variable bound in the advice or pointcut.
@this( SomeAnnotation )
    any join point where the type of the currently executing object
    has an annotation of type SomeAnnotation
@target( SomeAnnotation )
    any join point where the type of the target object has an
    annotation of type SomeAnnotation
@args(SomeAnnotation)
    any join point where there is one argument, and the type of the
    argument has an annotation of type SomeAnnotation
@args(*,SomeAnnotation)
    any join point where there are two arguments, the type of the
    second having an annotation of type SomeAnnotation
@args(SomeAnnotation,..,SomeOtherAnnotation)
    any join point with at least three arguments, the type of the first
    having an annotation of type SomeAnnotation, and the type of the
    last having an annotation of type SomeOtherAnnotation
@within(SomeAnnotation)
    any join point where the associated code is defined in a type with
    an annotation of type SomeAnnotation
@withincode(SomeAnnotation)
    any join point where the associated code is defined in a method
    or constructor with an annotation of type SomeAnnotation
@annotation(SomeAnnotation)
    any join point where the subject has an annotation of type
    SomeAnnotation
    Note: any position in an “@xxx” pointcut can be replaced with a
    variable bound in the advice or pointcut.
general form:
    call(MethodPat)
    call(ConstructorPat)
    execution(MethodPat)
    execution(ConstructorPat)
    initialization(ConstructorPat)
    preinitialization(ConstructorPat)
    staticinitialization(TypePat)
    get(FieldPat)
    set(FieldPat)
    handler(TypePat)
    adviceexecution()
    within(TypePat)
    withincode(MethodPat)
    withincode(ConstructorPat)
    cflow(Pointcut)
    cflowbelow(Pointcut)
    if(Expression)
    this(Type | Var)
    target(Type | Var)
    args(Type | Var , …)
    @this(Type|Var)
    @target(Type|Var)
    @args(Type|Var, …)
    @within(Type|Var)
    @withincode(Type|Var)
    @annotation(Type|Var)

where MethodPat is:
    [ModifiersPat] TypePat [TypePat . ] IdPat ( TypePat | .., … )
        [ throws ThrowsPat ]
ConstructorPat is:
    [ModifiersPat ] [TypePat . ] new ( TypePat | .. , …)
        [ throws ThrowsPat ]
FieldPat is:
    [ModifiersPat] TypePat [TypePat . ] IdPat
TypePat is one of:
    IdPat [ + ] [ [] … ]
    ! TypePat
    TypePat && TypePat
    TypePat || TypePat
    ( TypePat )
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
export type MemberDeclarationsArray =
    Array<MethodDeclarationStructure | ConstructorDeclarationStructure | PropertyDeclarationStructure>;

/**
 * Declares that the `superclass` of a given class is another `class`.
 *
 * @param aspectClass - The `aspect` class.
 * @param className - The name of the `class` whose `superclass` is
 * being declared.
 * @param superClassName - The name of the `superclass`.
 *
 * @example
 * declareParentsExtends(aspectClass, 'C', 'D');
 * @throws ReferenceError if the class or superclass is not found.
 * @see ClassDeclaration
 */
export function declareParentsExtends(
    aspectClass: ClassDeclaration,
    className: string,
    superClassName: string
): void {
    // Add method to aspect class
    aspectClass.addMethod({
        name: 'declareParentsExtends',
        statements: [
            // Check if the superclass extends the original superclass of the class
            `if (!isLegalInheritance('${className}', '${superClassName}')) {`,
            `    throw new TypeError('Inheritance is not legal: ${className} cannot extend ${superClassName}');`,
            `}`,
            // Log the declaration that class className extends superClassName
            `console.log('declare parents : ${className} extends ${superClassName};');`
        ],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Checks if the inheritance is legal according to `AspectJ` specifications.
 *
 * @param aspectClass - The `aspect` class.
 * @param className - The name of the `class`.
 * @param superClassName - The name of the `superclass`.
 * @returns  Returns true if the inheritance is legal, false otherwise.
 * @throws ReferenceError if the class or superclass is not found.
 * @see ClassDeclaration
 */
export function isLegalInheritance(
    aspectClass: ClassDeclaration, className: string, superClassName: string
): boolean {
    // Find class declarations within the provided aspect class
    let classDeclaration: ClassDeclaration | undefined =
        aspectClass.getSourceFile().getClass(className);
    let superClassDeclaration: ClassDeclaration | undefined =
        aspectClass.getSourceFile().getClass(superClassName);
    if (!classDeclaration || !superClassDeclaration) {
        throw new ReferenceError(`Class ${className} or Superclass ${superClassName} not found.`);
    }
    // Get super class of both className and superClassName
    const classSuperClass: string | undefined =
        classDeclaration.getExtends()?.getType().getText();
    const superClassSuperClass: string | undefined =
        superClassDeclaration.getExtends()?.getType().getText();
    // Check if superClassName extends the original superclass of className
    return classSuperClass === superClassSuperClass;
}

/**
 * Declares that a given `class` implements one or more interfaces.
 *
 * @param aspectClass - The `aspect` class.
 * @param className - The name of the `class.
 * @param interfaces - The interfaces that the `class` implements.
 *
 * @example
 * declareParentsImplements(aspectClass, 'C', ['I', 'J']);
 * @see ClassDeclaration
 */
export function declareParentsImplements(
    aspectClass: ClassDeclaration, className: string, interfaces: Array<string>): void {
    // Add method to aspect class
    aspectClass.addMethod({
        name: 'declareParentsImplements',
        statements: [
            // Check if the class implements the interfaces
            `if (!areInterfacesImplemented(this.constructor, '${className}', ${JSON.stringify(interfaces)})) {`,
            `    throw new Error('Implementation is not legal: ${className} cannot implement ${interfaces.join(', ')}');`,
            `}`,
            // Log the declaration that class className implements interfaces
            `console.log('declare parents : ${className} implements ${interfaces.join(', ')};');`
        ],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Checks if the `class` implements the given interfaces.
 *
 * @param aspectClass - The `aspect` class.
 * @param className The name of the `class`.
 * @param interfaces The interfaces that the `class` should implement.
 * @returns  Returns true if the class implements the interfaces, false
 * otherwise.
 * @throws ReferenceError if the class is not found.
 * @see ClassDeclaration
 */
export function areInterfacesImplemented(
    aspectClass: ClassDeclaration, className: string, interfaces: Array<string>
): boolean {
    // Find class declaration within the provided aspect class
    let classDeclaration: ClassDeclaration | undefined =
        aspectClass.getSourceFile().getClass(className);
    if (!classDeclaration) {
        throw new ReferenceError(`Class ${className} not found.`);
    }
    // Get implemented interfaces of the class
    const implementedInterfaces: Array<string> =
        classDeclaration.getImplements().map(
            (impl: ExpressionWithTypeArguments) => impl.getText());
    // Check if all given interfaces are implemented by the class
    return interfaces.every((interfaceName: string) =>
        implementedInterfaces.includes(interfaceName));
}

/**
 * Declares a compiler `warning` for a specified `pointcut`.
 *
 * @param aspectClass - The `aspect` class.
 * @param pointcut - The `pointcut` at which the `warning` should be
 * issued.
 * @param message - The `warning` message.
 *
 * @example
 * declareWarning(aspectClass, 'set(* Point.*) && !within(Point)', 'bad set');
 */
export function declareWarning(
    aspectClass: ClassDeclaration, pointcut: string, message: string
): void {
    aspectClass.addMethod({
        name: 'declareWarning',
        statements: [
            'const e = new Error();',
            `const currentLine = e.stack.split('\\n')[2].split(':')[1];`,
            `const currentColumn = e.stack.split('\\n')[2].split(':')[2];`,
            `console.warn('${pointcut} : "${message}" at line ' + currentLine + ', column ' + currentColumn);`
        ],
        returnType: 'void',
        kind: StructureKind.Method,
    });
}

/**
 * Declares a compiler `error` for a specified `pointcut`.
 *
 * @param aspectClass - The `aspect` class.
 * @param pointcut - The `pointcut` at which the error should be issued.
 * @param message - The `error` message.
 *
 * @example
 * declareError(aspectClass, 'call(Singleton.new(..))', 'bad construction');
 */
export function declareError(
    aspectClass: ClassDeclaration, pointcut: string, message: string): void {
    aspectClass.addMethod({
        name: 'declareError',
        statements: [`throw new SyntaxError('${pointcut} : "${message}" );`],
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
 * declareSoft(aspectClass, 'IOException', 'execution(Foo.new(..))');
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
const exampleClass: ClassDeclaration =
    sourceFile.addClass({
        name: 'ExampleAspect', isAbstract: false, kind: StructureKind.Class
    });
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
