import {
    Project,
    StructureKind,
    ClassDeclarationStructure,
    MethodDeclarationStructure,
    SourceFile
} from 'ts-morph';

/*
Advice Declarations

before () : get(int Foo.y) { ... }
    runs before reading the field int Foo.y
after () returning : call(int Foo.m(int)) { ... }
    runs after calls to int Foo.m(int) that return normally
after () returning (int x) : call(int Foo.m(int)) { ... }
    same, but the return value is named x in the body
after () throwing : call(int Foo.m(int)) { ... }
    runs after calls to m that exit abruptly by throwing an exception
after () throwing (NotFoundException e) : call(int Foo.m(int)) { ... }
    runs after calls to m that exit abruptly by throwing a
    NotFoundException. The exception is named e in the body
after () : call(int Foo.m(int)) { ... }
    runs after calls to m regardless of how they exit
before(int i) : set(int Foo.x) && args(i) { ... }
    runs before field assignment to int Foo.x. The value to be
    assigned is named i in the body
before(Object o) : set(* Foo.*) && args(o) { ... }
    runs before field assignment to any field of Foo. The value to be
    assigned is converted to an object type (int to Integer, for
    example) and named o in the body
int around () : call(int Foo.m(int)) { ... }
    runs instead of calls to int Foo.m(int), and returns an int. In the
    body, continue the call by using proceed(), which has the same
    signature as the around advice.
int around () throws IOException : call(int Foo.m(int)) { ... }
    same, but the body is allowed to throw IOException
Object around () : call(int Foo.m(int)) { ... }
    same, but the value of proceed() is converted to an Integer, and
    the body should also return an Integer which will be converted
    into an int
Special forms in advice
thisJoinPoint
    reflective information about the join point.
thisJoinPointStaticPart
    the equivalent of thisJoinPoint.getStaticPart(), but may use fewer resources.
thisEnclosingJoinPointStaticPart
    the static part of the join point enclosing this one.
proceed (Arguments)
    only available in around advice. The Arguments must be the same number and type as the parameters of the advice.
*/

// Create a new project using ts-morph
const project: Project = new Project();
// Add a new source file named Advice.ts
const sourceFile: SourceFile = project.createSourceFile('advice.ts', '', { overwrite: true });

/**
 * Creates an advice method.
 * @param name - The name of the advice.
 * @param type - The type of the advice (before, after, around).
 * @param formals - The formal parameters of the advice.
 * @param pointcut - The pointcut expression.
 * @param body - The body of the advice.
 * @returns The created advice method.
 */
export function createAdvice(
    name: string,
    type: 'before' | 'after' | 'around',
    formals: string,
    pointcut: string,
    body: string
): MethodDeclarationStructure {
    return {
        name: name,
        parameters: formals ? formals.split(',').map(param => ({ name: param.trim() })) : [],
        statements: [body],
        returnType: type === 'around' ? 'any' : 'void',
        decorators: [
            {
                name: 'Advice',
                arguments: [`${type}(${formals}) : ${pointcut}`],
                kind: StructureKind.Decorator
            }
        ],
        kind: StructureKind.Method
    };
}

// Create the class with advice methods
const adviceClass: ClassDeclarationStructure = {
    kind: StructureKind.Class,
    name: 'Advices',
    isExported: true,
    methods: [
        createAdvice('beforeGetY', 'before', '', 'get(int Foo.y)', `console.log('Before getting Foo.y');`),
        createAdvice('afterCallM', 'after', '', 'call(int Foo.m(int))', `console.log('After calling Foo.m(int)');`),
        createAdvice('afterCallMReturningX', 'after', 'int x', 'call(int Foo.m(int))', `console.log('After calling Foo.m(int) with return value:', x);`),
        createAdvice('afterCallMThrowing', 'after', '', 'call(int Foo.m(int))', `console.log('After Foo.m(int) threw an exception');`),
        createAdvice('afterCallMThrowingNotFoundException', 'after', 'NotFoundException e', 'call(int Foo.m(int))', `console.log('Foo.m(int) threw NotFoundException:', e);`),
        createAdvice('afterCallMRegardless', 'after', '', 'call(int Foo.m(int))', `console.log('After Foo.m(int) regardless of exit');`),
        createAdvice('beforeSetX', 'before', 'int i', 'set(int Foo.x) && args(i)', `console.log('Before setting Foo.x to', i);`),
        createAdvice('beforeSetAnyField', 'before', 'Object o', 'set(* Foo.*) && args(o)', `console.log('Before setting any Foo field to', o);`),
        createAdvice('aroundCallM', 'around', '', 'call(int Foo.m(int))', `console.log('Around calling Foo.m(int) with thisJoinPoint:', thisJoinPoint);
        console.log('Static part of this join point:', thisJoinPointStaticPart);
        console.log('Static part of enclosing join point:', thisEnclosingJoinPointStaticPart);
        return proceed();`),
        createAdvice('aroundCallMThrowingIOException', 'around', '', 'call(int Foo.m(int))', `console.log('Around calling Foo.m(int) with possible IOException and thisJoinPoint:', thisJoinPoint);
        try { return proceed(); } catch (e) { throw e; }`),
        createAdvice('aroundCallMReturningObject', 'around', '', 'call(int Foo.m(int))', `console.log('Around calling Foo.m(int) with Object return and thisJoinPoint:', thisJoinPoint);
        return proceed();`)
    ]
};

// Add the class to the source file
sourceFile.addClass(adviceClass);

// Save the source file
project.save().then(() => {
    console.log('advice.ts has been created with various advice declarations including special forms');
});
