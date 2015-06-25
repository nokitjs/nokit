#include <stdlib.h>
#include "nan.h"
#include "v8-debug.h"

namespace nodex {

  class Debug {
    public:

      static NAN_METHOD(Call) {
        NanScope();

        if (args.Length() < 1) {
          return NanThrowError("Error");
        }

        v8::Handle<v8::Function> fn = v8::Handle<v8::Function>::Cast(args[0]);
        v8::Debug::Call(fn);

        NanReturnUndefined();
      };

      static NAN_METHOD(SendCommand) {
        NanScope();

        v8::String::Value command(args[0]);
#if (NODE_MODULE_VERSION > 0x000B)
        v8::Isolate* debug_isolate = v8::Debug::GetDebugContext()->GetIsolate();
        v8::HandleScope debug_scope(debug_isolate);
        v8::Debug::SendCommand(debug_isolate, *command, command.length());
#else
        v8::Debug::SendCommand(*command, command.length());
#endif
        NanReturnUndefined();
      };

      static NAN_METHOD(RunScript) {
        NanScope();

        v8::Local<v8::String> script_source(args[0]->ToString());
        if (script_source.IsEmpty())
          NanReturnUndefined();
        v8::Context::Scope context_scope(v8::Debug::GetDebugContext());
        v8::Local<v8::Script> script = v8::Script::Compile(script_source);
        if (script.IsEmpty())
          NanReturnUndefined();

        NanReturnValue(script->Run());
      };

      static NAN_METHOD(AllowNatives) {
        NanScope();

        const char allow_natives_syntax[] = "--allow_natives_syntax";
        v8::V8::SetFlagsFromString(allow_natives_syntax, sizeof(allow_natives_syntax) - 1);

        NanReturnUndefined();
      }

      static v8::Handle<v8::Object> createExceptionDetails(v8::Handle<v8::Message> message) {
        NanEscapableScope();

        v8::Handle<v8::Object> exceptionDetails = NanNew<v8::Object>();
        exceptionDetails->Set(NanNew<v8::String>("text"), message->Get());

#if (NODE_MODULE_VERSION > 0x000E)
        exceptionDetails->Set(NanNew<v8::String>("url"), message->GetScriptOrigin().ResourceName());
        exceptionDetails->Set(NanNew<v8::String>("scriptId"), NanNew<v8::Number>(message->GetScriptOrigin().ScriptID()->Value()));
#else
        exceptionDetails->Set(NanNew<v8::String>("url"), message->GetScriptResourceName());
#endif
        exceptionDetails->Set(NanNew<v8::String>("line"), NanNew<v8::Integer>(message->GetLineNumber()));
        exceptionDetails->Set(NanNew<v8::String>("column"), NanNew<v8::Number>(message->GetStartColumn()));

        if (!message->GetStackTrace().IsEmpty())
          exceptionDetails->Set(NanNew<v8::String>("stackTrace"), message->GetStackTrace()->AsArray());
        else
          exceptionDetails->Set(NanNew<v8::String>("stackTrace"), NanUndefined());

        return NanEscapeScope(exceptionDetails);
      };

      static NAN_METHOD(EvaluateWithExceptionDetails) {
        NanScope();

        if (args.Length() < 1)
          return NanThrowError("One argument expected.");

        v8::Local<v8::String> expression = args[0]->ToString();
        if (expression.IsEmpty())
          return NanThrowTypeError("The argument must be a string.");

        v8::TryCatch tryCatch;
        v8::Handle<v8::Value> result = NanRunScript(NanCompileScript(expression));

        v8::Local<v8::Object> wrappedResult = NanNew<v8::Object>();
        if (tryCatch.HasCaught()) {
          wrappedResult->Set(NanNew<v8::String>("result"), tryCatch.Exception());
          wrappedResult->Set(NanNew<v8::String>("exceptionDetails"), createExceptionDetails(tryCatch.Message()));
        } else {
          wrappedResult->Set(NanNew<v8::String>("result"), result);
          wrappedResult->Set(NanNew<v8::String>("exceptionDetails"), NanUndefined());
        }

        NanReturnValue(wrappedResult);
      };

      static NAN_METHOD(SetNonEnumProperty) {
        NanScope();

        if (args.Length() < 3)
          return NanThrowError("Three arguments expected.");
        if (!args[0]->IsObject())
          return NanThrowTypeError("Argument 0 must be an object.");
        if (!args[1]->IsString())
          return NanThrowTypeError("Argument 1 must be a string.");

        v8::Local<v8::Object> object = args[0]->ToObject();
        object->ForceSet(args[1], args[2], v8::DontEnum);

        NanReturnUndefined();
      };

      static NAN_METHOD(Subtype) {
        NanScope();

        if (args.Length() < 1)
          return NanThrowError("One argument expected.");

        v8::Handle<v8::Value> value = args[0];
        if (value->IsArray())
          NanReturnValue(NanNew<v8::String>("array"));
#if (NODE_MODULE_VERSION > 0x000B)
        if (value->IsTypedArray())
          NanReturnValue(NanNew<v8::String>("array"));
#endif
        if (value->IsDate())
          NanReturnValue(NanNew<v8::String>("date"));

        if (value->IsRegExp())
          NanReturnValue(NanNew<v8::String>("regexp"));

        if (value->IsNativeError())
          NanReturnValue(NanNew<v8::String>("error"));
#if (NODE_MODULE_VERSION > 0x000E)
        if (value->IsArgumentsObject())
          NanReturnValue(NanNew<v8::String>("array"));

        if (value->IsMap() || value->IsWeakMap())
          NanReturnValue(NanNew<v8::String>("map"));

        if (value->IsSet() || value->IsWeakSet())
          NanReturnValue(NanNew<v8::String>("set"));

        if (value->IsMapIterator() || value->IsSetIterator())
          NanReturnValue(NanNew<v8::String>("iterator"));
#endif
        NanReturnUndefined();
      };

      static v8::Local<v8::String> functionDisplayName(v8::Handle<v8::Function> function) {
        NanEscapableScope();

        v8::Handle<v8::Value> value;
#if (NODE_MODULE_VERSION > 0x000B)
        value = function->GetDisplayName();
        if (value->IsString() && value->ToString()->Length())
          return NanEscapeScope(value->ToString());
#endif
        value = function->GetName();
        if (value->IsString() && value->ToString()->Length())
          return NanEscapeScope(value->ToString());

        value = function->GetInferredName();
        if (value->IsString() && value->ToString()->Length())
          return NanEscapeScope(value->ToString());

        return NanEscapeScope(NanNew<v8::String>(""));
      };

      static NAN_METHOD(InternalConstructorName) {
        NanScope();

        if (args.Length() < 1)
          return NanThrowError("One argument expected.");
        if (!args[0]->IsObject())
          return NanThrowTypeError("The argument must be an object.");

        v8::Local<v8::Object> object = args[0]->ToObject();
        v8::Local<v8::String> result = object->GetConstructorName();

        char* result_type;
        if (result.IsEmpty() || result->IsNull() || result->IsUndefined())
          result_type = "";
        else
          result_type = *NanUtf8String(args[0]);

        if (!result.IsEmpty() && strcmp(result_type, "Object") == 0) {
          v8::Local<v8::String> constructorSymbol = NanNew<v8::String>("constructor");
          if (object->HasRealNamedProperty(constructorSymbol) && !object->HasRealNamedCallbackProperty(constructorSymbol)) {
            v8::TryCatch tryCatch;
            v8::Local<v8::Value> constructor = object->GetRealNamedProperty(constructorSymbol);
            if (!constructor.IsEmpty() && constructor->IsFunction()) {
              v8::Local<v8::String> constructorName = functionDisplayName(v8::Handle<v8::Function>::Cast(constructor));
              if (!constructorName.IsEmpty() && !tryCatch.HasCaught())
                result = constructorName;
            }
          }
          if (strcmp(result_type, "Object") == 0 && object->IsFunction())
            result = NanNew<v8::String>("Function");
        }

        NanReturnValue(result);
      }

      static NAN_METHOD(FunctionDetailsWithoutScopes) {
        NanScope();

        if (args.Length() < 1)
          return NanThrowError("One argument expected.");

        if (!args[0]->IsFunction())
          return NanThrowTypeError("The argument must be a function.");

        v8::Handle<v8::Function> function = v8::Handle<v8::Function>::Cast(args[0]);
        int lineNumber = function->GetScriptLineNumber();
        int columnNumber = function->GetScriptColumnNumber();

        v8::Local<v8::Object> location = NanNew<v8::Object>();
        location->Set(NanNew<v8::String>("lineNumber"), NanNew<v8::Integer>(lineNumber));
        location->Set(NanNew<v8::String>("columnNumber"), NanNew<v8::Integer>(columnNumber));
#if (NODE_MODULE_VERSION > 0x000B)
        location->Set(NanNew<v8::String>("scriptId"),
          NanNew<v8::Integer>(function->ScriptId())->ToString());
#else
        location->Set(NanNew<v8::String>("scriptId"),
          NanNew<v8::Integer>(function->GetScriptId()->ToInt32()->Value())->ToString());
#endif
        v8::Local<v8::Object> result = NanNew<v8::Object>();
        result->Set(NanNew<v8::String>("location"), location);

        v8::Handle<v8::String> name = functionDisplayName(function);
        result->Set(NanNew<v8::String>("functionName"), name.IsEmpty() ? NanNew<v8::String>("") : name);

        NanReturnValue(result);
      }

      static NAN_METHOD(CallFunction) {
        NanScope();

        if (args.Length() < 2 || args.Length() > 3)
          return NanThrowError("Two or three arguments expected.");
        if (!args[0]->IsFunction())
          return NanThrowTypeError("Argument 0 must be a function.");

        v8::Handle<v8::Function> function = v8::Handle<v8::Function>::Cast(args[0]);
#if (NODE_MODULE_VERSION > 0x000B)
        v8::Handle<v8::Value> receiver = args[1];
#else
        v8::Handle<v8::Object> receiver = args[1]->ToObject();
#endif

        if (args.Length() < 3 || args[2]->IsUndefined()) {
          v8::Local<v8::Value> result = function->Call(receiver, 0, NULL);
          NanReturnValue(result);
        }

        if (!args[2]->IsArray())
          return NanThrowTypeError("Argument 2 must be an array.");

        v8::Handle<v8::Array> arguments = v8::Handle<v8::Array>::Cast(args[2]);
        int argc = arguments->Length();
        v8::Handle<v8::Value> *argv = new v8::Handle<v8::Value>[argc];
        for (int i = 0; i < argc; ++i)
            argv[i] = arguments->Get(i);

        v8::Local<v8::Value> result = function->Call(receiver, argc, argv);

        delete [] argv;
        NanReturnValue(result);
      };

      static NAN_METHOD(Eval) {
        NanScope();

        if (args.Length() < 1)
          return NanThrowError("One argument expected.");

        v8::Local<v8::String> expression = args[0]->ToString();
        if (expression.IsEmpty())
          return NanThrowTypeError("The argument must be a string.");

        v8::TryCatch tryCatch;
        v8::Handle<v8::Script> script = v8::Script::Compile(expression);
        if (tryCatch.HasCaught())
          return NanThrowError(tryCatch.ReThrow());

        v8::Handle<v8::Value> result = NanRunScript(script);
        if (tryCatch.HasCaught())
          return NanThrowError(tryCatch.ReThrow());

        NanReturnValue(result);
      };

    private:
      Debug() {}
      ~Debug() {}
  };

  void Initialize(v8::Handle<v8::Object> target) {
    NanScope();

    NODE_SET_METHOD(target, "call", Debug::Call);
    NODE_SET_METHOD(target, "sendCommand", Debug::SendCommand);
    NODE_SET_METHOD(target, "runScript", Debug::RunScript);
    NODE_SET_METHOD(target, "allowNatives", Debug::RunScript);

    v8::Local<v8::Object> InjectedScriptHost = NanNew<v8::Object>();
    NODE_SET_METHOD(InjectedScriptHost, "eval", Debug::Eval);
    NODE_SET_METHOD(InjectedScriptHost, "evaluateWithExceptionDetails", Debug::EvaluateWithExceptionDetails);
    NODE_SET_METHOD(InjectedScriptHost, "setNonEnumProperty", Debug::SetNonEnumProperty);
    NODE_SET_METHOD(InjectedScriptHost, "subtype", Debug::Subtype);
    NODE_SET_METHOD(InjectedScriptHost, "internalConstructorName", Debug::InternalConstructorName);
    NODE_SET_METHOD(InjectedScriptHost, "functionDetailsWithoutScopes", Debug::FunctionDetailsWithoutScopes);
    NODE_SET_METHOD(InjectedScriptHost, "callFunction", Debug::CallFunction);

    target->Set(NanNew<v8::String>("InjectedScriptHost"), InjectedScriptHost);
  }

  NODE_MODULE(debug, Initialize)
}
