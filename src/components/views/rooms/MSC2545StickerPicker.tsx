/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017, 2018 Vector Creations Ltd
Copyright 2019 Michael Telatynski <7t3chguy@gmail.com>
Copyright 2019, 2020, 2022 The Matrix.org Foundation C.I.C.

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

import { IImageInfo, Room } from 'matrix-js-sdk/src/matrix';
import React, { useContext, useState } from 'react';

import MatrixClientContext from '../../../contexts/MatrixClientContext';
import { mediaFromMxc } from '../../../customisations/Media';
import ContextMenu, { ChevronFace } from '../../structures/ContextMenu';
import ScrollPanel from '../../structures/ScrollPanel';
import GenericElementContextMenu from '../context_menus/GenericElementContextMenu';
import Search from '../emojipicker/Search';

// TODO: support more image sources:
// https://github.com/Sorunome/matrix-doc/blob/soru/emotes/proposals/2545-emotes.md#image-sources
const USER_PACK_ROOMS_EVENT_TYPE = "im.ponies.emote_rooms";
const PACK_ROOM_EVENT_TYPE = "im.ponies.room_emotes";

// Css Class; it's a short name for easy usage.
const cc = (thing: string) => "mx_2545Stickers_" + thing;

interface I2545Image {
    url: string; // mxc
    body?: string;
    info?: IImageInfo;
    // 2545: If present and non-empty, this overrides the usage defined at pack level for this particular image
    usage?: ("sticker" | "emoticon")[];
}

interface I2545Pack {
    pack: {
        attribution?: string;
        // 2545: If the usage is absent or empty, a usage for all possible usage types is to be assumed.
        usage?: ("emoticon" | "sticker")[];
        avatar_url?: string;
        display_name?: string;
    };
    images: {
        [id: string]: I2545Image;
    };
}

const PackImage: React.FC<{
    image: I2545Image,
    roomId: string,
    threadId: string,
    setStickerPickerOpen: (isStickerPickerOpen: boolean) => void,
    innerRef: React.RefObject<HTMLImageElement> | null
}> = ({ image, roomId, threadId, setStickerPickerOpen, innerRef }) => {
    const cli = useContext(MatrixClientContext);
    const media = mediaFromMxc(image.url, cli);
    // noinspection JSIgnoredPromiseFromCall

    const onImageClick = (imgEvt: React.MouseEvent) => {
        imgEvt.preventDefault();
        cli.sendStickerMessage(roomId, threadId, media.srcMxc, image.info, image.body);
        setStickerPickerOpen(false);
    };

    if (media.isEncrypted) return
        <p>Stickers from encrypted rooms aren't supported {"):"}</p>;

    // eslint-disable-next-line new-cap
    return <div className={cc("imageContainer")}>
        <img ref={innerRef} src={media.srcHttp} onClick={onImageClick} alt={image.body} />
    </div>;
};


export const MSC2545StickerPicker: React.FC<{
    room: Room;
    threadId: string;
    menuPosition?: any;
    isStickerPickerOpen: boolean;
    setStickerPickerOpen: (isStickerPickerOpen: boolean) => void;
}> = ({ room, threadId, menuPosition, isStickerPickerOpen, setStickerPickerOpen }) => {
    const cli = useContext(MatrixClientContext);
    const [searchFilter, setSearchFilter] = useState("");
    if (!isStickerPickerOpen) return null;

    const evt = cli.getAccountData(USER_PACK_ROOMS_EVENT_TYPE);
    // TODO: check if null
    const evtContent = evt.event.content as { rooms: { [roomId: string]: { [packName: string]: {} } } };

    const packs = Object.keys(evtContent.rooms)
        .map(roomId => {
            const room = cli.getRoom(roomId);
            return Object.keys(evtContent.rooms[roomId])
                .map(name => {
                    // TODO: check if null
                    const pack = room.currentState.getStateEvents(PACK_ROOM_EVENT_TYPE, name)
                        .event.content as I2545Pack;
                    return { room, pack, packName: name };
                });
        }).flat(1);

    const topStickerRef = React.createRef<HTMLImageElement>();

    const finished = (send: boolean) => () => {
        if (isStickerPickerOpen) {
            if (send) topStickerRef.current.click();
            setStickerPickerOpen(false);
            setSearchFilter("");
        }
    };


    const renderedPacks = packs.map(({ pack, packName }, packIdx) => {
        const lcFilter = searchFilter.toLowerCase().trim(); // filter is case insensitive
        const images = Object.values(pack.images)
            .filter(im => (im.body || "").toLowerCase().includes(lcFilter));

        if (images.length == 0) return;

        const progressiveDisplayName = pack.pack.display_name || packName;
        return <div key={"pack-" + packName}>
            <h3 className={cc("label")}>{progressiveDisplayName}</h3>
            <div className={cc("grid")}>
                {images.map((im, idx) => <PackImage
                    innerRef={(!packIdx && !idx) ? topStickerRef : null}
                    key={idx}
                    image={im}
                    roomId={room.roomId}
                    threadId={threadId}
                    setStickerPickerOpen={setStickerPickerOpen} />)}
            </div>
        </div>;
    });


    return <ContextMenu
        chevronFace={ChevronFace.Bottom}
        menuWidth={300}
        menuHeight={500}
        onFinished={finished(false)}
        menuPaddingTop={0}
        menuPaddingLeft={0}
        menuPaddingRight={0}
        zIndex={3500}
        {...menuPosition}
    >
        <GenericElementContextMenu element={
            <ScrollPanel startAtBottom={false} className={cc("root")}>
                <Search query={searchFilter} onChange={setSearchFilter} onEnter={finished(true)} />
                {renderedPacks}
            </ScrollPanel>}
            onResize={finished(false)} />
    </ContextMenu>;
};

/* const accountDataHandler = useCallback((ev) => {
*     console.log("ckalm", ev);
*     // TODO
* }, [cli]);
* useTypedEventEmitter(cli, ClientEvent.AccountData, accountDataHandler);
*/
// Count of how many operations are currently in progress, if > 0 then show a Spinner
/* const [pendingUpdateCount, setPendingUpdateCount] = useState(0); */
/* const startUpdating = useCallback(() => {
*     setPendingUpdateCount(pendingUpdateCount + 1);
* }, [pendingUpdateCount]);
* const stopUpdating = useCallback(() => {
*     setPendingUpdateCount(pendingUpdateCount - 1);
* }, [pendingUpdateCount]); */
