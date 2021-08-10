// Copyright 2021 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import ServerKit
// #import TestKit
// jshint esversion: 8
/* global SKAMQPJobQueue, SKJob */
"use strict";

(function(){

var MockAMQP = TKMock({
    connect: ["url"]
});

var MockAMQPConnection = TKMock({
    on: ["eventType", "handler"],
    off: ["eventType", "handler"],
    createChannel: [],
    close: []
});

var MockAMQPChannel = TKMock({
    on: ["eventType", "handler"],
    off: ["eventType", "handler"],
    prefetch: ["count"],
    assertQueue: ["queue", "options"],
    sendToQueue: ["queue", "content", "options"],
    consume: ["queue", "handler", "options"],
    ack: ["message"],
    nack: ["message", "all", "requeue"]
});

JSClass("SKAMQPJobQueueTests", TKTestSuite, {

    requiredEnvironment: "node",

    queue: null,

    setup: async function(){
    },

    teardown: async function(){
        if (this.queue !== null){
            await this.queue.close();
            this.queue = null;
        }
    },

    testOpen: async function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.mock.connect.results.push({value: Promise.resolve(connection)});
        connection.mock.createChannel.results.push({value: Promise.resolve(channel)});
        connection.mock.on.results.push({});
        connection.mock.on.results.push({});
        channel.mock.prefetch.results.push({value: Promise.resolve()});
        channel.mock.assertQueue.results.push({value: Promise.resolve({queue: "queue1"})});
        channel.mock.on.results.push({});
        channel.mock.on.results.push({});
        this.queue = SKAMQPJobQueue.initWithURL(JSURL.initWithString("amqp://amqp.breakside.io:1234/queue1"), amqp);
        await this.queue.open();
        TKAssertEquals(amqp.mock.connect.calls.length, 1);
        TKAssertType(amqp.mock.connect.calls[0].url, "string");
        TKAssertEquals(amqp.mock.connect.calls[0].url, "amqp://amqp.breakside.io:1234/");
        TKAssertEquals(connection.mock.createChannel.calls.length, 1);
        TKAssertEquals(connection.mock.on.calls.length, 2);
        TKAssertEquals(connection.mock.on.calls[0].eventType, "error");
        TKAssertEquals(connection.mock.on.calls[1].eventType, "close");
        TKAssertEquals(channel.mock.prefetch.calls.length, 1);
        TKAssertEquals(channel.mock.prefetch.calls[0].count, 1);
        TKAssertEquals(channel.mock.assertQueue.calls.length, 1);
        TKAssertEquals(channel.mock.assertQueue.calls[0].queue, "queue1");
        TKAssertExactEquals(channel.mock.assertQueue.calls[0].options.durable, true);
        TKAssertExactEquals(channel.mock.assertQueue.calls[0].options.maxPriority, 5);
        TKAssertExactEquals(channel.mock.assertQueue.calls[0].options.deadLetterExchange, "SKJobQueue.failed");
        TKAssertEquals(channel.mock.on.calls.length, 2);
        TKAssertEquals(channel.mock.on.calls[0].eventType, "error");
        TKAssertEquals(channel.mock.on.calls[1].eventType, "close");
    },

    testEnqueue: async function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.mock.connect.results.push({value: Promise.resolve(connection)});
        connection.mock.createChannel.results.push({value: Promise.resolve(channel)});
        connection.mock.on.results.push({});
        connection.mock.on.results.push({});
        channel.mock.prefetch.results.push({value: Promise.resolve()});
        channel.mock.assertQueue.results.push({value: Promise.resolve({queue: "queue1"})});
        channel.mock.on.results.push({});
        channel.mock.on.results.push({});
        this.queue = SKAMQPJobQueue.initWithURL(JSURL.initWithString("amqp://amqp.breakside.io:1234/queue1"), amqp);
        await this.queue.open();

        channel.mock.sendToQueue.results.push({value: Promise.resolve()});
        var job = SKAMQPJobQueueTestsJob.initWithFields("one", 2);
        job.priority = SKJob.Priority.high;
        TKAssertNull(job.id);
        await this.queue.enqueue(job);
        TKAssertType(job.id, "string");
        TKAssertEquals(job.id.substr(0, 4), "job_");
        TKAssertEquals(job.id.length, 44);
        TKAssertEquals(channel.mock.sendToQueue.calls.length, 1);
        TKAssertEquals(channel.mock.sendToQueue.calls[0].queue, "queue1");
        var json = channel.mock.sendToQueue.calls[0].content.stringByDecodingUTF8();
        var dictionary = JSON.parse(json);
        TKAssertExactEquals(channel.mock.sendToQueue.calls[0].options.persistent, true);
        TKAssertExactEquals(channel.mock.sendToQueue.calls[0].options.priority, 4);
        
        channel.mock.sendToQueue.results.push({value: Promise.reject(new Error("testing"))});
        job = SKAMQPJobQueueTestsJob.initWithFields("one", 2);
        await TKAssertPromiseRejected(this.queue.enqueue(job));
        TKAssertEquals(channel.mock.sendToQueue.calls.length, 2);
    },

    testConsume: async function(){
        var amqp = new MockAMQP();
        var connection = new MockAMQPConnection();
        var channel = new MockAMQPChannel();
        amqp.mock.connect.results.push({value: Promise.resolve(connection)});
        connection.mock.createChannel.results.push({value: Promise.resolve(channel)});
        connection.mock.on.results.push({});
        connection.mock.on.results.push({});
        channel.mock.prefetch.results.push({value: Promise.resolve()});
        channel.mock.assertQueue.results.push({value: Promise.resolve({queue: "queue1"})});
        channel.mock.on.results.push({});
        channel.mock.on.results.push({});
        this.queue = SKAMQPJobQueue.initWithURL(JSURL.initWithString("amqp://amqp.breakside.io:1234/queue1"), amqp);
        await this.queue.open();

        channel.mock.sendToQueue.results.push({value: Promise.resolve()});
        var job = SKAMQPJobQueueTestsJob.initWithFields("one", 2);
        job.priority = SKJob.Priority.low;
        TKAssertNull(job.id);
        await this.queue.enqueue(job);
        var content = channel.mock.sendToQueue.calls[0].content;

        var queue = this.queue;
        var consume;
        var consumer = {
            jobQueueCanDequeue: function(queue2){
                TKAssertExactEquals(queue2, queue);
                consume();
            }
        };

        channel.mock.consume.results.push({value: Promise.resolve()});
        await queue.consume(consumer);
        TKAssertEquals(channel.mock.consume.calls.length, 1);
        TKAssertEquals(channel.mock.consume.calls[0].queue, "queue1");
        TKAssertExactEquals(channel.mock.consume.calls[0].options.noAck, false);

        var message = {
            content: content
        };
        JSRunLoop.main.schedule(channel.mock.consume.calls[0].handler, undefined, message);

        var ready = new Promise(function(resolve, reject){ consume = resolve; });
        var consumed = ready.then(function(){
            return queue.dequeue();
        }).then(function(job2){
            TKAssertNotNull(job2);
            TKAssertInstance(job2, SKAMQPJobQueueTestsJob);
            TKAssertNotExactEquals(job2, job);
            TKAssertEquals(job2.id, job.id);
            TKAssertEquals(job2.priority, SKJob.Priority.low);
            TKAssertExactEquals(job2.field1, "one");
            TKAssertExactEquals(job2.field2, 2);
            channel.mock.ack.results.push({vaue: Promise.resolve()});
            return queue.complete(job2, null);
        }).then(function(){
            TKAssertEquals(channel.mock.ack.calls.length, 1);
            TKAssertExactEquals(channel.mock.ack.calls[0].message, message);
            return queue.dequeue();
        }).then(function(job3){
            TKAssertNull(job3);
        });

        await consumed;
    }

});

JSClass("SKAMQPJobQueueTestsJob", SKJob, {

    field1: null,
    field2: null,

    initWithFields: function(field1, field2){
        this.field1 = field1;
        this.field2 = field2;
    },

    initFromDictionary: function(dictionary){
        this.field1 = dictionary.field1;
        this.field2 = dictionary.field2;
    },

    encodeToDictionary: function(dictionary){
        dictionary.field1 = this.field1;
        dictionary.field2 = this.field2;
    }
});

})();