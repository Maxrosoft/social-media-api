import request from "supertest";
import { describe, it } from "mocha";
import { expect } from "chai";
import app from "../src/app";

describe("Health Check", () => {
    it("should return 200 OK", async () => {
        const response = await request(app).get("/health");
        expect(response.status).to.equal(200);
    });

    it("should return 200 OK", async () => {
        const response = await request(app).get("/status");
        expect(response.status).to.equal(200);
    });
});