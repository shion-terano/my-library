/* =========================================================
   私の蔵書
   apps.js
========================================================= */


/* =========================================================
   Google Apps Script
========================================================= */

const GAS_URL =
    "https://script.google.com/macros/s/AKfycbwk8XvbThvQ4iZCremj4HKVEO961y4yRq-opbZtrPUxe5GKjfbBm-96dyuCoo-xUaSKyQ/exec";


/* =========================================================
   データ
========================================================= */

let books = [];

let labels = [
    "未分類"
];

let editingBookId = null;

let editingLabelName = null;

let scannerWindow = null;


/* =========================================================
   DOM
========================================================= */

const bookList =
    document.getElementById(
        "bookList"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const labelFilter =
    document.getElementById(
        "labelFilter"
    );

const bookCount =
    document.getElementById(
        "bookCount"
    );

const addButton =
    document.getElementById(
        "addButton"
    );

const addChoiceModal =
    document.getElementById(
        "addChoiceModal"
    );

const bookModal =
    document.getElementById(
        "bookModal"
    );

const detailModal =
    document.getElementById(
        "detailModal"
    );

const labelManagerModal =
    document.getElementById(
        "labelManagerModal"
    );

const labelEditModal =
    document.getElementById(
        "labelEditModal"
    );

const barcodeChoice =
    document.getElementById(
        "barcodeChoice"
    );

const manualChoice =
    document.getElementById(
        "manualChoice"
    );

const bookForm =
    document.getElementById(
        "bookForm"
    );

const bookModalTitle =
    document.getElementById(
        "bookModalTitle"
    );

const bookLabel =
    document.getElementById(
        "bookLabel"
    );

const newLabel =
    document.getElementById(
        "newLabel"
    );

const detailContent =
    document.getElementById(
        "detailContent"
    );

const editButton =
    document.getElementById(
        "editButton"
    );

const deleteButton =
    document.getElementById(
        "deleteButton"
    );

const addLabelButton =
    document.getElementById(
        "addLabelButton"
    );

const labelManagerList =
    document.getElementById(
        "labelManagerList"
    );

const editLabelInput =
    document.getElementById(
        "editLabelInput"
    );

const saveLabelEditButton =
    document.getElementById(
        "saveLabelEditButton"
    );

const syncButton =
    document.getElementById(
        "syncButton"
    );

const syncStatus =
    document.getElementById(
        "syncStatus"
    );


/* =========================================================
   初期化
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadBooksFromGoogle();

    }
);


/* =========================================================
   Google Sheetsから読み込み
========================================================= */

async function loadBooksFromGoogle() {

    setSyncStatus(
        "読み込み中…"
    );

    try {

        const response =
            await fetch(
                GAS_URL +
                "?action=getBooks&_=" +
                Date.now()
            );

        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }

        const data =
            await response.json();

        if (
            !Array.isArray(data)
        ) {

            throw new Error(
                "データ形式が不正です"
            );

        }

        books =
            data.map(
                normalizeBook
            );

        rebuildLabels();

        refreshLabelControls();

        renderBooks();

        setSyncStatus(
            "同期済み"
        );

    } catch (error) {

        console.error(
            "読み込みエラー:",
            error
        );

        setSyncStatus(
            "読み込みに失敗しました"
        );

        /*
         * 一時的に通信できない場合は
         * 前回のキャッシュを使用
         */

        loadLocalCache();

        rebuildLabels();

        refreshLabelControls();

        renderBooks();

    }

}


/* =========================================================
   データ正規化
========================================================= */

function normalizeBook(
    book
) {

    return {

        id:
            String(
                book.id ||
                crypto.randomUUID()
            ),

        isbn:
            String(
                book.isbn ||
                ""
            ),

        title:
            String(
                book.title ||
                ""
            ),

        author:
            String(
                book.author ||
                ""
            ),

        year:
            String(
                book.year ||
                ""
            ),

        publisher:
            String(
                book.publisher ||
                ""
            ),

        coverUrl:
            String(
                book.coverUrl ||
                ""
            ),

        label:
    String(
        book.label ||
        "00_未分類"
    ).replace(
        /^未分類$/,
        "00_未分類"
    )

    };

}


/* =========================================================
   ローカルキャッシュ
========================================================= */

function saveLocalCache() {

    localStorage.setItem(
        "my-library-cache-v2",
        JSON.stringify(
            books
        )
    );

}


function loadLocalCache() {

    try {

        const value =
            localStorage.getItem(
                "my-library-cache-v2"
            );

        if (value) {

            books =
                JSON.parse(
                    value
                ).map(
                    normalizeBook
                );

        }

    } catch (error) {

        console.error(
            error
        );

        books = [];

    }

}


/* =========================================================
   ラベル再構築
========================================================= */

function rebuildLabels() {

    const set =
        new Set(
            ["00_未分類"]
        );

    books.forEach(
        book => {

            if (
                book.label
            ) {

                set.add(
                    book.label ===
                    "未分類"
                        ?
                        "00_未分類"
                        :
                        book.label
                );

            }

        }
    );

    labels =
        Array.from(
            set
        );

}


/* =========================================================
   ラベルUI
========================================================= */

function refreshLabelControls() {

    const currentFilter =
        labelFilter.value;

    /*
     * ラベルフィルター
     */

    labelFilter.innerHTML = "";

    /*
     * すべてのラベル
     */

    const allOption =
        document.createElement("option");

    allOption.value = "";

    allOption.textContent =
    "すべてのラベル";

    labelFilter.appendChild(
        allOption
    );


    /*
     * 各ラベル
     */

const sortedLabels =
    [...labels].sort(
        (a, b) => {

            /*
             * 00_未分類は常に先頭
             */

            if (
                a === "00_未分類"
            ) {

                return -1;

            }

            if (
                b === "00_未分類"
            ) {

                return 1;

            }


            /*
             * ラベル先頭の番号を取得
             */

            const numA =
                parseInt(
                    a.split("_")[0],
                    10
                ) || 999999;


            const numB =
                parseInt(
                    b.split("_")[0],
                    10
                ) || 999999;


            return numA - numB;

        }
    );

    sortedLabels.forEach(
    label => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            label;


        const count =
            books.filter(
                book =>
                    (
                        book.label ||
                        "未分類"
                    ) ===
                    label
            ).length;


        option.textContent =
            `${label}（${count}冊）`;


        labelFilter.appendChild(
            option
        );

    }
);


    /*
     * ラベル編集
     */

    const separator =
        document.createElement(
            "option"
        );

    separator.disabled = true;

    separator.textContent =
        "────────────";

    labelFilter.appendChild(
        separator
    );


    const editOption =
        document.createElement(
            "option"
        );

    editOption.value =
        "__EDIT_LABELS__";

    editOption.textContent =
        "⚙ ラベル編集";

    labelFilter.appendChild(
        editOption
    );


    /*
     * 以前選択していたラベルを復元
     */

    if (
        labels.includes(
            currentFilter
        )
    ) {

        labelFilter.value =
            currentFilter;

    } else {

        labelFilter.value =
            "";

    }


    /*
     * 本登録フォームのラベル選択
     */

    bookLabel.innerHTML =
        "";

    labels.forEach(
        label => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                label;

            option.textContent =
                label;

            bookLabel.appendChild(
                option
            );

        }
    );

    /* 総冊数 */

if (bookCount) {

    bookCount.textContent =
        ` 📚 ${books.length}冊`;

}

}


/* =========================================================
   本一覧
========================================================= */

function renderBooks() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const selectedLabel =
        labelFilter.value;


    const filteredBooks =
        books.filter(
            book => {

                const text = [

                    book.isbn,
                    book.title,
                    book.author,
                    book.year,
                    book.publisher,
                    book.label

                ]
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    text.includes(
                        search
                    );


                const matchesLabel =
                    !selectedLabel ||
                    book.label ===
                    selectedLabel;


                return (
                    matchesSearch &&
                    matchesLabel
                );

            }
        );


    bookList.innerHTML =
        "";


    if (
        filteredBooks.length === 0
    ) {

        bookList.innerHTML =
            `
            <p class="empty-message">
                まだ本が登録されていません。
            </p>
            `;

        return;

    }


    filteredBooks.forEach(
        book => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "book-card";


            card.addEventListener(
                "click",
                () =>
                    openDetail(
                        book.id
                    )
            );


            const cover =
                book.coverUrl
                    ?
                    `
                    <img
                        src="${escapeAttribute(
                            book.coverUrl
                        )}"
                        alt="書影"
                        onerror="
                            this.style.display='none';
                        "
                    >
                    `
                    :
                    `
                    <span class="no-cover">
                        書影なし
                    </span>
                    `;


            card.innerHTML =
                `
                <div class="book-cover">
                    ${cover}
                </div>

                <div class="book-info">

                    <div class="book-title">
                        ${escapeHtml(
                            book.title ||
                            "無題"
                        )}
                    </div>

                    <div class="book-meta">
                        著者・編者：
                        ${escapeHtml(
                            book.author
                        )}
                    </div>

                    <div class="book-meta">
                        出版年：
                        ${escapeHtml(
                            book.year
                        )}
                    </div>

                    <div class="book-meta">
                        出版社：
                        ${escapeHtml(
                            book.publisher
                        )}
                    </div>

                    <div class="book-label">
                        ${escapeHtml(
                            book.label ||
                            "未分類"
                        )}
                    </div>

                </div>
                `;


            bookList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   ＋
========================================================= */

addButton.addEventListener(
    "click",
    () => {

        showModal(
            addChoiceModal
        );

    }
);


/* =========================================================
   手入力
========================================================= */

manualChoice.addEventListener(
    "click",
    () => {

        hideModal(
            addChoiceModal
        );

        openBookForm();

    }
);


/* =========================================================
   バーコード
========================================================= */

barcodeChoice.addEventListener(
    "click",
    () => {

        hideModal(
            addChoiceModal
        );

        startExternalBarcodeScanner();

    }
);


/* =========================================================
   GitHubバーコードスキャナー
========================================================= */

function startExternalBarcodeScanner() {

    const scannerUrl =
        "https://shion-terano.github.io/barcode-scanner/";

    scannerWindow =
        window.open(
            scannerUrl,
            "barcodeScanner",
            "width=450,height=700"
        );


    if (!scannerWindow) {

        alert(
            "バーコードスキャナーを開けませんでした。\n\n" +
            "ブラウザのポップアップブロックを確認してください。"
        );

        return;

    }

}


/* =========================================================
   GitHubからISBN受信
========================================================= */

window.addEventListener(
    "message",
    async event => {

        if (
            event.origin !==
            "https://shion-terano.github.io"
        ) {

            return;

        }


        if (
            !event.data ||
            event.data.type !==
            "ISBN_SCANNED"
        ) {

            return;

        }


        const rawISBN =
            event.data.isbn;


        if (!rawISBN) {

            return;

        }


        const isbn =
            String(
                rawISBN
            ).replace(
                /[^0-9Xx]/g,
                ""
            );


        if (
            !/^\d{13}$/.test(
                isbn
            )
        ) {

            alert(
                "ISBN-13を読み取れませんでした。"
            );

            return;

        }


        if (
            scannerWindow &&
            !scannerWindow.closed
        ) {

            scannerWindow.close();

        }

        scannerWindow = null;


        openBookForm();


        document.getElementById(
            "isbn"
        ).value =
            isbn;


        await fetchBookFromNDL(
            isbn
        );

    }
);


/* =========================================================
   ISBN入力
========================================================= */

document.getElementById(
    "isbn"
).addEventListener(
    "keydown",
    async event => {

        if (
            event.key !==
            "Enter"
        ) {

            return;

        }

        event.preventDefault();


        const isbn =
            event.target.value.trim();


        if (!isbn) {

            return;

        }


        await fetchBookFromNDL(
            isbn
        );

    }
);


/* =========================================================
   NDL
========================================================= */

async function fetchBookFromNDL(
    isbn
) {

    const cleanISBN =
        String(isbn)
            .replace(
                /[^0-9Xx]/g,
                ""
            );


    if (!cleanISBN) {

        return;

    }


    setBookFormLoading(
        true
    );


    try {

        const url =
            "https://ndlsearch.ndl.go.jp/api/opensearch?" +
            "isbn=" +
            encodeURIComponent(
                cleanISBN
            ) +
            "&cnt=2";


        const response =
            await fetch(
                url
            );


        if (!response.ok) {

            throw new Error(
                "NDL API error: " +
                response.status
            );

        }


        const xmlText =
            await response.text();


        const parser =
            new DOMParser();


        const xml =
            parser.parseFromString(
                xmlText,
                "application/xml"
            );


const items =
    Array.from(
        xml.getElementsByTagName(
            "item"
        )
    );


if (items.length === 0) {

    alert(
        "国立国会図書館サーチから書誌情報を取得できませんでした。\n" +
        "手入力してください。"
    );

    return;

}


/*
 * 同じISBNに複数の書誌レコードが
 * 返ってくることがあるため、
 * タイトルが一番長い(＝正題＋副題を
 * 含んでいる可能性が高い)レコードを採用する
 */

let item =
    items[0];


let bestTitleLength =
    getElementText(
        item,
        "title"
    ).length;


items.forEach(
    candidate => {

        const candidateTitle =
            getElementText(
                candidate,
                "title"
            );


        if (
            candidateTitle.length >
            bestTitleLength
        ) {

            item =
                candidate;

            bestTitleLength =
                candidateTitle.length;

        }

    }
);


        /* =================================================
           タイトル
           ================================================= */

        const title =
            getNDLDisplayTitle(
                item
            );


        /* =================================================
           著者・編者
           ================================================= */

        const author =
            getAuthorEditorText(
                item
            );


        /* =================================================
           出版社
           ================================================= */

        const publisher =
            getNamespacedText(
                item,
                "publisher"
            );


        /* =================================================
           出版年
           ================================================= */

        const date =
            getNamespacedText(
                item,
                "date"
            );


        /* =================================================
           フォームへ入力
           ================================================= */

        document.getElementById(
            "isbn"
        ).value =
            cleanISBN;


        document.getElementById(
            "title"
        ).value =
            title;


        document.getElementById(
            "author"
        ).value =
            author;


        document.getElementById(
            "publisher"
        ).value =
            cleanText(
                publisher
            );


        document.getElementById(
            "year"
        ).value =
            extractYear(
                date
            );


    } catch (error) {

        console.error(
            "NDL取得エラー:",
            error
        );


        alert(
            "書誌情報の取得に失敗しました。\n\n" +
            "ISBNを確認して、必要なら手入力してください。"
        );


    } finally {

        setBookFormLoading(
            false
        );

    }

}


/* =========================================================
   NDL表示用タイトル
========================================================= */

function getNDLDisplayTitle(
    item
) {

    /*
     * NDLの検索結果では、
     *
     * ・タイトル
     * ・巻次
     * ・版
     * ・シリーズ名
     * ・各巻タイトル
     *
     * などを組み合わせて表示することがあります。
     *
     * OpenSearchのdescriptionにも
     * 「タイトル：」
     * 「シリーズ名：」
     * 「版：」
     * などの情報が含まれるため、
     * そこから取得します。
     */


    const description =
        getElementText(
            item,
            "description"
        );


    /*
     * まずXMLの<title>を取得
     */

    let title =
        cleanText(
            getElementText(
                item,
                "title"
            )
        );


    /*
     * descriptionから
     * 「タイトル：」を探す
     */

    const descriptionTitle =
        extractNDLDescriptionField(
            description,
            "タイトル"
        );


    if (
        descriptionTitle
    ) {

        title =
            cleanText(
                descriptionTitle
            );

    }


    /*
     * 版情報
     *
     * 例：
     * 改訂新版
     * 第2版
     */

    const edition =
        getNamespacedText(
            item,
            "edition"
        );


    /*
     * シリーズ名
     */

    const series =
        extractNDLDescriptionField(
            description,
            "シリーズ名"
        );


    /*
     * 巻次
     */

    const volume =
        extractNDLDescriptionField(
            description,
            "巻次"
        );


    /*
     * 各巻タイトル
     */

    const volumeTitle =
        extractNDLDescriptionField(
            description,
            "各巻タイトル"
        );


    /*
     * タイトルを組み立てる
     */

    const parts = [];


    /*
     * 基本タイトル
     */

    if (title) {

        parts.push(
            title
        );

    }


    /*
     * 各巻タイトル
     */

    if (
        volumeTitle &&
        !title.includes(
            volumeTitle
        )
    ) {

        parts.push(
            volumeTitle
        );

    }


    /*
     * 巻次
     */

    if (volume) {

        parts.push(
            volume
        );

    }


    /*
     * 版情報
     */

    if (edition) {

        parts.push(
            cleanText(
                edition
            )
        );

    }


    /*
     * シリーズ名
     *
     * NDL検索結果に近づけるため
     * 括弧で追加
     */

    if (series) {

        const seriesText =
            cleanText(
                series
            );


        if (
            seriesText &&
            !title.includes(
                seriesText
            )
        ) {

            parts.push(
                "(" +
                seriesText +
                ")"
            );

        }

    }


    /*
     * 重複を削除
     */

    const uniqueParts =
        parts.filter(
            (
                value,
                index,
                array
            ) =>
                value &&
                array.indexOf(
                    value
                ) === index
        );


    return cleanText(
        uniqueParts.join(
            " "
        )
    );

}


/* =========================================================
   NDL descriptionから項目を取得
========================================================= */

function extractNDLDescriptionField(
    description,
    fieldName
) {

    if (!description) {

        return "";

    }


    /*
     * HTMLタグを除去
     */

    const text =
        String(
            description
        )
            .replace(
                /<[^>]*>/g,
                " "
            );


    /*
     * HTMLエンティティを簡易的に戻す
     */

    const decoded =
        text
            .replace(
                /&amp;/g,
                "&"
            )
            .replace(
                /&lt;/g,
                "<"
            )
            .replace(
                /&gt;/g,
                ">"
            )
            .replace(
                /&quot;/g,
                '"'
            );


    /*
     * 例：
     *
     * タイトル：統計学が最強の学問である :
     * データ社会を生き抜くための武器と教養
     *
     * シリーズ名：放送大学教材
     */


    const escapedField =
        fieldName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );


    const regex =
        new RegExp(
            escapedField +
            "\\s*：\\s*" +
            "(.+?)(?=" +
            "タイトル：|" +
            "タイトル（読み）：|" +
            "責任表示：|" +
            "シリーズ名：|" +
            "シリーズ名（読み）：|" +
            "巻次：|" +
            "各巻タイトル：|" +
            "版：|" +
            "出版地：|" +
            "出版者：|" +
            "出版年月：|" +
            "NDC|" +
            "$" +
            ")",
            "u"
        );


    const match =
        decoded.match(
            regex
        );


    if (!match) {

        return "";

    }


    return cleanText(
        match[1]
    );

}


/* =========================================================
   著者・編者
========================================================= */

function getAuthorEditorText(
    item
) {

    const description =
        getElementText(
            item,
            "description"
        );


    if (!description) {

        return "";

    }


    /*
     * NDLのdescriptionには
     *
     * 責任表示：三浦定俊, 佐野千絵, 木川りか 著
     *
     * が入っている。
     */


    const match =
        description.match(
            /責任表示：\s*([^<]+)/u
        );


    if (!match) {

        return "";

    }


    return cleanText(
        match[1]
    );

}


/* =========================================================
   XMLヘルパー
========================================================= */

function getElementText(
    parent,
    tagName
) {

    const element =
        parent.getElementsByTagName(
            tagName
        )[0];


    return element
        ?
        element.textContent
        :
        "";

}


function getNamespacedText(
    parent,
    localName
) {

    const elements =
        parent.getElementsByTagNameNS(
            "*",
            localName
        );


    return elements.length
        ?
        elements[0].textContent
        :
        "";

}


function extractYear(
    value
) {

    if (!value) {

        return "";

    }


    const match =
        value.match(
            /\d{4}/
        );


    return match
        ?
        match[0]
        :
        value;

}


function cleanText(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/* =========================================================
   登録フォーム
========================================================= */

function openBookForm(
    book = null
) {

    editingBookId =
        book
            ?
            book.id
            :
            null;


    bookModalTitle.textContent =
        book
            ?
            "本を編集"
            :
            "本を登録";


    document.getElementById(
        "isbn"
    ).value =
        book?.isbn ||
        "";


    document.getElementById(
        "title"
    ).value =
        book?.title ||
        "";


    document.getElementById(
        "author"
    ).value =
        book?.author ||
        "";


    document.getElementById(
        "year"
    ).value =
        book?.year ||
        "";


    document.getElementById(
        "publisher"
    ).value =
        book?.publisher ||
        "";


    document.getElementById(
        "coverUrl"
    ).value =
        book?.coverUrl ||
        "";


    refreshLabelControls();


    bookLabel.value =
book?.label ||
"00_未分類";


    showModal(
        bookModal
    );

}


/* =========================================================
   保存
========================================================= */

bookForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const button =
            document.getElementById(
                "saveBookButton"
            );


        button.disabled =
            true;


        button.textContent =
            "保存中…";


        const book = {

            id:
                editingBookId ||
                crypto.randomUUID(),

            isbn:
                document.getElementById(
                    "isbn"
                ).value.trim(),

            title:
                document.getElementById(
                    "title"
                ).value.trim(),

            author:
                document.getElementById(
                    "author"
                ).value.trim(),

            year:
                document.getElementById(
                    "year"
                ).value.trim(),

            publisher:
                document.getElementById(
                    "publisher"
                ).value.trim(),

            coverUrl:
                document.getElementById(
                    "coverUrl"
                ).value.trim(),

            label:
                bookLabel.value ||
                "未分類"

        };


        try {

            await saveBookToGoogle(
                book
            );


            /*
             * Googleへの保存成功後、
             * ローカルにも反映
             */

            if (
                editingBookId
            ) {

                books =
                    books.map(
                        existing =>
                            existing.id ===
                            editingBookId
                                ?
                                book
                                :
                                existing
                    );

            } else {

                books.push(
                    book
                );

            }


            saveLocalCache();

            rebuildLabels();

            refreshLabelControls();

            renderBooks();

            hideModal(
                bookModal
            );


            setSyncStatus(
                "保存しました"
            );


        } catch (error) {

            console.error(
                "保存エラー:",
                error
            );


            alert(
                "保存に失敗しました。\n\n" +
                error.message
            );

        } finally {

            button.disabled =
                false;

            button.textContent =
                "保存";

        }

    }
);


/* =========================================================
   Googleへ保存
========================================================= */

async function saveBookToGoogle(
    book
) {

    const body =
        new URLSearchParams();


    body.append(
        "action",
        "saveBook"
    );


    body.append(
        "book",
        JSON.stringify(
            book
        )
    );


    const response =
        await fetch(
            GAS_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body: body.toString()
            }
        );


    if (!response.ok) {

        throw new Error(
            "Googleへの保存に失敗しました。"
        );

    }


    /*
     * Apps Scriptの返答
     */

    try {

        const result =
            await response.json();


        if (
            result &&
            result.success === false
        ) {

            throw new Error(
                result.error ||
                "保存に失敗しました。"
            );

        }

    } catch (error) {

        /*
         * JSONを取得できない場合でも
         * HTTPが成功していれば保存済み
         */

        console.warn(
            "保存結果のJSONを取得できませんでした。",
            error
        );

    }

}


/* =========================================================
   ラベル追加
========================================================= */

addLabelButton.addEventListener(
    "click",
    () => {

        const value =
            newLabel.value.trim();


        if (!value) {

            return;

        }


        if (
            !labels.includes(
                value
            )
        ) {

            labels.push(
                value
            );

        }


        refreshLabelControls();


        bookLabel.value =
            value;


        newLabel.value =
            "";

    }
);


/* =========================================================
   ラベル管理
========================================================= */

function renderLabelManager() {

    labelManagerList.innerHTML =
        "";


    const sortedLabels =
        [...labels].sort(
            (a, b) => {

                /*
                 * 00_未分類は常に先頭
                 */

                if (
                    a === "00_未分類"
                ) {

                    return -1;

                }

                if (
                    b === "00_未分類"
                ) {

                    return 1;

                }


                /*
                 * ラベル先頭の番号で並べ替え
                 */

                const numA =
                    parseInt(
                        a.split("_")[0],
                        10
                    ) || 999999;


                const numB =
                    parseInt(
                        b.split("_")[0],
                        10
                    ) || 999999;


                return numA - numB;

            }
        );


    sortedLabels.forEach(
        label => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "label-manager-row";


            const name =
                document.createElement(
                    "span"
                );

            name.textContent =
                label;


            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.textContent =
                "編集";


            if (
    label ===
    "00_未分類"
) {

    button.disabled =
        true;

} else {

                button.addEventListener(
                    "click",
                    () =>
                        openLabelEdit(
                            label
                        )
                );

            }


            row.appendChild(
                name
            );

            row.appendChild(
                button
            );

            labelManagerList.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   ラベル編集
========================================================= */

function openLabelEdit(
    label
) {

    editingLabelName =
        label;


    editLabelInput.value =
        label;


    showModal(
        labelEditModal
    );

}


saveLabelEditButton.addEventListener(
    "click",
    async () => {

        const newName =
            editLabelInput.value.trim();


        if (
            !newName ||
            !editingLabelName
        ) {

            return;

        }


        if (
            newName ===
            editingLabelName
        ) {

            hideModal(
                labelEditModal
            );

            return;

        }


        if (
            labels.includes(
                newName
            )
        ) {

            alert(
                "そのラベルはすでに存在します。"
            );

            return;

        }


        books =
            books.map(
                book =>
                    book.label ===
                    editingLabelName
                        ?
                        {
                            ...book,
                            label:
                                newName
                        }
                        :
                        book
            );


        labels =
            labels.map(
                label =>
                    label ===
                    editingLabelName
                        ?
                        newName
                        :
                        label
            );


        try {

            await saveAllBooksToGoogle();

            saveLocalCache();

            refreshLabelControls();

            renderBooks();

            renderLabelManager();

            hideModal(
                labelEditModal
            );

            setSyncStatus(
                "ラベルを更新しました"
            );

        } catch (error) {

            console.error(
                error
            );

            alert(
                "ラベルの保存に失敗しました。"
            );

        }

    }
);


/* =========================================================
   全データ保存
========================================================= */

async function saveAllBooksToGoogle() {

    const body =
        new URLSearchParams();


    body.append(
        "action",
        "saveAll"
    );


    body.append(
        "books",
        JSON.stringify(
            books
        )
    );


    const response =
        await fetch(
            GAS_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body:
                    body.toString()
            }
        );


    if (!response.ok) {

        throw new Error(
            "Googleへの保存に失敗しました。"
        );

    }

}


/* =========================================================
   詳細
========================================================= */

function openDetail(
    id
) {

    const book =
        books.find(
            book =>
                book.id === id
        );


    if (!book) {

        return;

    }


    detailContent.innerHTML =
        `
        <div class="detail-book">

            <div class="detail-cover">

                ${
                    book.coverUrl
                        ?
                        `
                        <img
                            src="${escapeAttribute(
                                book.coverUrl
                            )}"
                            alt="書影"
                            onerror="
                                this.style.display='none';
                            "
                        >
                        `
                        :
                        `
                        <div class="no-cover">
                            書影なし
                        </div>
                        `
                }

            </div>


            <div class="detail-info">

                <div class="detail-title">
                    ${escapeHtml(
                        book.title ||
                        "無題"
                    )}
                </div>


                <div class="detail-row">
                    著者・編者：
                    ${escapeHtml(
                        book.author
                    )}
                </div>


                <div class="detail-row">
                    出版年：
                    ${escapeHtml(
                        book.year
                    )}
                </div>


                <div class="detail-row">
                    出版社：
                    ${escapeHtml(
                        book.publisher
                    )}
                </div>


                <div class="detail-row">
                    ISBN：
                    ${escapeHtml(
                        book.isbn
                    )}
                </div>


                <div class="book-label">
                    ${escapeHtml(
                        book.label ||
                        "未分類"
                    )}
                </div>

            </div>

        </div>
        `;


    editButton.onclick =
        () => {

            hideModal(
                detailModal
            );

            openBookForm(
                book
            );

        };


    deleteButton.onclick =
        async () => {

            const ok =
                confirm(
                    "この本を削除しますか？"
                );


            if (!ok) {

                return;

            }


            try {

                await deleteBookFromGoogle(
                    id
                );


                books =
                    books.filter(
                        book =>
                            book.id !==
                            id
                    );


                saveLocalCache();

                renderBooks();

                hideModal(
                    detailModal
                );

                setSyncStatus(
                    "削除しました"
                );


            } catch (error) {

                console.error(
                    error
                );

                alert(
                    "削除に失敗しました。"
                );

            }

        };


    showModal(
        detailModal
    );

}


/* =========================================================
   Googleから削除
========================================================= */

async function deleteBookFromGoogle(
    id
) {

    const body =
        new URLSearchParams();


    body.append(
        "action",
        "deleteBook"
    );


    body.append(
        "id",
        id
    );


    const response =
        await fetch(
            GAS_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body:
                    body.toString()
            }
        );


    if (!response.ok) {

        throw new Error(
            "削除に失敗しました。"
        );

    }

}


/* =========================================================
   検索
========================================================= */

searchInput.addEventListener(
    "input",
    renderBooks
);


/* =========================================================
   ラベルフィルター
========================================================= */

labelFilter.addEventListener(
    "change",
    event => {

        /*
         * 「ラベル編集」が選択された場合
         */

        if (
            event.target.value ===
            "__EDIT_LABELS__"
        ) {

            /*
             * フィルターを
             * 「すべてのラベル」に戻す
             */

            labelFilter.value = "";


            /*
             * ラベル編集画面を表示
             */

            renderLabelManager();

            showModal(
                labelManagerModal
            );

            return;

        }


        /*
         * 通常のラベル選択
         */

        renderBooks();

    }
);


/* =========================================================
   同期ボタン
========================================================= */

syncButton.addEventListener(
    "click",
    async () => {

        await loadBooksFromGoogle();

    }
);


/* =========================================================
   モーダル
========================================================= */

function showModal(
    modal
) {

    if (!modal) {

        return;

    }

    modal.classList.remove(
        "hidden"
    );

}


function hideModal(
    modal
) {

    if (!modal) {

        return;

    }

    modal.classList.add(
        "hidden"
    );

}


document
    .querySelectorAll(
        "[data-close]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    hideModal(
                        document.getElementById(
                            button.dataset.close
                        )
                    );

                }
            );

        }
    );


/* =========================================================
   ローディング
========================================================= */

function setBookFormLoading(
    loading
) {

    const title =
        document.getElementById(
            "title"
        );


    if (loading) {

        title.placeholder =
            "書誌情報を取得しています…";

    } else {

        title.placeholder =
            "";

    }

}


/* =========================================================
   同期表示
========================================================= */

function setSyncStatus(
    text
) {

    if (
        syncStatus
    ) {

        syncStatus.textContent =
            text;

    }

}


/* =========================================================
   XSS対策
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}
