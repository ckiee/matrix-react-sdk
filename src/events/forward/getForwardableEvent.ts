/*
Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { M_POLL_START } from "matrix-events-sdk";
import { M_BEACON_INFO } from "matrix-js-sdk/src/@types/beacon";
import { MatrixEvent, MatrixClient } from "matrix-js-sdk/src/matrix";

import { getForwardableBeaconEvent } from "./getForwardableBeacon";

/**
 * Get forwardable event for a given event
 * If an event is not forwardable return null
 */
export const getForwardableEvent = (event: MatrixEvent, cli: MatrixClient): MatrixEvent | null => {
    if (M_POLL_START.matches(event.getType())) {
        return null;
    }
    if (M_BEACON_INFO.matches(event.getType())) {
        return getForwardableBeaconEvent(event, cli);
    }
    return event;
};

