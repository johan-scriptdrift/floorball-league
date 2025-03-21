"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var mongoose_1 = require("mongoose");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var BASE_URL = 'https://app.innebandy.se/api/leagueapi/getpreviousleaguegames/';
var LEAGUE_ID = process.env.LEAGUE_ID;
var AUTH_TOKEN = process.env.AUTH_TOKEN;
var gameSchema = new mongoose_1.default.Schema({
    GameID: { type: Number, required: true, unique: true },
    GameStatusID: { type: Number, required: true },
    LeagueID: { type: Number, required: true },
    LeagueName: { type: String, required: true },
    GameRound: { type: Number, required: true },
    LeagueDisplayName: { type: String, required: true },
    HomeTeamID: { type: Number, required: true },
    AwayTeamID: { type: Number, required: true },
    HomeTeamClubName: { type: String, required: true },
    AwayTeamClubName: { type: String, required: true },
    HomeTeamScore: String,
    AwayTeamScore: String,
    GameTime: String,
    ArenaName: String,
    UpdatedAt: { type: String }
});
var Game = mongoose_1.default.model('Game', gameSchema);
var DATABASE_URL = process.env.DATABASE_URL ||
    'mongodb://127.0.0.1:27017/floorball-league';
console.log('Connecting to MongoDB...');
mongoose_1.default
    .connect(DATABASE_URL)
    .then(function () {
    console.log('Connected to MongoDB');
})
    .catch(function (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
function parseGameId(id) {
    return typeof id === 'string' ? parseInt(id, 10) : id;
}
function fetchGames() {
    return __awaiter(this, arguments, void 0, function (lastGameId) {
        var allGames, hasMoreData, retryCount, maxRetries, seenGameIds, emptyResponseCount, maxEmptyResponses, response, data, newGames, error_1;
        var _a, _b, _c, _d, _e;
        if (lastGameId === void 0) { lastGameId = 0; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    allGames = [];
                    hasMoreData = true;
                    retryCount = 0;
                    maxRetries = 3;
                    seenGameIds = new Set();
                    emptyResponseCount = 0;
                    maxEmptyResponses = 5;
                    _f.label = 1;
                case 1:
                    if (!(hasMoreData && retryCount < maxRetries)) return [3 /*break*/, 12];
                    _f.label = 2;
                case 2:
                    _f.trys.push([2, 7, , 11]);
                    console.log("Fetching games with lastGameId: ".concat(lastGameId));
                    return [4 /*yield*/, axios_1.default.get("".concat(BASE_URL, "?leagueid=").concat(LEAGUE_ID, "&lastgameid=").concat(lastGameId), {
                            headers: {
                                Authorization: AUTH_TOKEN,
                                Accept: 'application/json',
                                'X-Platform': '2',
                                'X-Requested-With': 'XMLHttpRequest',
                                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
                            }
                        })];
                case 3:
                    response = _f.sent();
                    data = response.data;
                    if (!(!data || !Array.isArray(data) || data.length === 0)) return [3 /*break*/, 5];
                    emptyResponseCount++;
                    console.log("Empty response received (".concat(emptyResponseCount, "/").concat(maxEmptyResponses, ")"));
                    if (emptyResponseCount >= maxEmptyResponses) {
                        console.log('Max empty responses reached, stopping');
                        hasMoreData = false;
                        return [3 /*break*/, 12];
                    }
                    lastGameId += 10;
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 4:
                    _f.sent();
                    return [3 /*break*/, 1];
                case 5:
                    emptyResponseCount = 0;
                    newGames = data.filter(function (game) {
                        var id = game.GameID;
                        if (!seenGameIds.has(id)) {
                            seenGameIds.add(id);
                            return true;
                        }
                        return false;
                    });
                    if (newGames.length > 0) {
                        allGames.push.apply(allGames, newGames);
                        console.log("Added ".concat(newGames.length, " new games. Total: ").concat(allGames.length));
                        lastGameId = data[data.length - 1].GameID;
                        console.log("Next lastGameId: ".concat(lastGameId));
                    }
                    else {
                        console.log('No new games found, stopping');
                        hasMoreData = false;
                        return [3 /*break*/, 12];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 6:
                    _f.sent();
                    return [3 /*break*/, 11];
                case 7:
                    error_1 = _f.sent();
                    if (axios_1.default.isAxiosError(error_1)) {
                        console.error('Error details:', {
                            status: (_a = error_1.response) === null || _a === void 0 ? void 0 : _a.status,
                            data: (_b = error_1.response) === null || _b === void 0 ? void 0 : _b.data,
                            config: {
                                url: (_c = error_1.config) === null || _c === void 0 ? void 0 : _c.url,
                                method: (_d = error_1.config) === null || _d === void 0 ? void 0 : _d.method,
                                headers: (_e = error_1.config) === null || _e === void 0 ? void 0 : _e.headers
                            }
                        });
                    }
                    retryCount++;
                    if (!(retryCount < maxRetries)) return [3 /*break*/, 9];
                    console.log("Retry attempt ".concat(retryCount, " of ").concat(maxRetries));
                    return [4 /*yield*/, new Promise(function (resolve) {
                            return setTimeout(resolve, 2000 * retryCount);
                        })];
                case 8:
                    _f.sent();
                    return [3 /*break*/, 10];
                case 9:
                    console.error('Max retries reached, stopping');
                    hasMoreData = false;
                    _f.label = 10;
                case 10: return [3 /*break*/, 11];
                case 11: return [3 /*break*/, 1];
                case 12: return [2 /*return*/, allGames];
            }
        });
    });
}
function saveGames(games) {
    return __awaiter(this, void 0, void 0, function () {
        var saved, errors, _i, games_1, gameData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Saving games to MongoDB...');
                    saved = 0;
                    errors = 0;
                    _i = 0, games_1 = games;
                    _a.label = 1;
                case 1:
                    if (!(_i < games_1.length)) return [3 /*break*/, 6];
                    gameData = games_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, Game.findOneAndUpdate({ GameID: gameData.GameID }, __assign(__assign({}, gameData), { UpdatedAt: new Date().toISOString() }), { upsert: true, new: true })];
                case 3:
                    _a.sent();
                    saved++;
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error("Error saving game ".concat(gameData.GameID, ":"), error_2);
                    errors++;
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    console.log("Saved ".concat(saved, " games, encountered ").concat(errors, " errors"));
                    return [2 /*return*/, { saved: saved, errors: errors }];
            }
        });
    });
}
mongoose_1.default.connection.once('open', function () {
    console.log('MongoDB connection ready, starting to fetch games...');
    fetchGames()
        .then(function (games) { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Total games fetched: ".concat(games.length));
                    return [4 /*yield*/, saveGames(games)];
                case 1:
                    result = _a.sent();
                    console.log('All games processed. Saved:', result.saved, 'Errors:', result.errors);
                    return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 2:
                    _a.sent();
                    console.log('Disconnected from MongoDB');
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    }); })
        .catch(function (error) {
        console.error('Fetching failed:', error);
        mongoose_1.default.disconnect();
        process.exit(1);
    });
});
