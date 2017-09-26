import * as _ from 'lodash';
import {Mocker} from "./Mock";
import {MethodStub} from "./stub/MethodStub";
import {CallThroughMethodStub} from "./stub/CallThroughMethodStub";
import {RealMethod} from "./spy/RealMethod";

export class Spy extends Mocker {
    private realMethods: { [key: string]: RealMethod };

    constructor(instance: any) {
        super(instance.constructor, instance);

        this.createMethodStubsFromOwnPropertyDescriptors(instance, false);
        this.createMethodStubsFromOwnPropertyNames(instance, false);
        this.createInstanceActionListenersFromOwnPropertyDescriptors(instance, false);
        this.createInstanceActionListenersFromOwnPropertyNames(instance, false);
    }

    public reset(): void {
        _.forEach(this.realMethods, (method, key) => {
            if (method.instance) {
                Object.defineProperty(this.instance, key, method.descriptor);
            } else {
                delete this.instance[key];
            }
        });

        super.reset();
    }

    protected getEmptyMethodStub(key: string, args: any[]): MethodStub {
        const realMethod = this.realMethods[key];

        if (realMethod) {
            const method = realMethod.descriptor.get || realMethod.descriptor.value;
            return new CallThroughMethodStub(this.instance, method);
        }

        return super.getEmptyMethodStub(key, args);
    }

    protected createInstancePropertyDescriptorListener(key: string,
                                                       descriptor: PropertyDescriptor,
                                                       prototype: any): void {
        if (!this.realMethods) {
            this.realMethods = {};
        }

        if (this.realMethods[key]) {
            return;
        }

        this.realMethods[key] = new RealMethod(descriptor, prototype === this.instance);
        Object.defineProperty(this.instance, key, {
            get: this.createActionListener(key),
            configurable: true
        });
    }

    protected createInstanceActionListener(key: string, prototype: any): void {
        if (!this.realMethods) {
            this.realMethods = {};
        }

        if (this.realMethods[key]) {
            return;
        }

        let descriptor = Object.getOwnPropertyDescriptor(prototype, key);
        this.realMethods[key] = new RealMethod(descriptor, prototype === this.instance);
        this.instance[key] = this.createActionListener(key);
    }
}