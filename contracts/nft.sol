// SPDX-License-Identifier: none

import "./interface/IBEP20.sol";
import "./interface/IERC721Metadata.sol";
import "./interface/IERC721Receiver.sol";

import "./library/Address.sol";
import "./library/Strings.sol";
import "./library/Counters.sol";
import "./library/hexStringToBytes.sol";

import "./abstract/ERC165.sol";
import "./abstract/ERC2981.sol";
import "./abstract/Ownable.sol";

pragma solidity ^0.8.0;

contract HobbitPirate is Ownable, ERC165, ERC2981, IERC721, IERC721Metadata {
    using Address for address;
    using Strings for uint256;
    using Counters for Counters.Counter;

    uint256 private _maxSupply;

    Counters.Counter private _genExist;
    Counters.Counter private _totalSupply;
    Counters.Counter private _nftExistId;

    string private _name;
    string private _symbol;
    string private _baseURI;

    nftSaleInfo private saleInfo;

    mapping(uint256 => nftInfo) private _nftGen;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    struct nftInfo{
        uint256 gen;
        rariryLevel rarity;
    }

    struct nftSaleInfo{
        uint256 price;
        address payment;
        address oracle;
    }

    enum rariryLevel{
        common,
        rare,
        legend
    }

    constructor(
        uint256 price_,
        uint256 maxSupply_,
        address payment_,
        address oracle_,
        address owner_,
        string memory name_,
        string memory symbol_,
        string memory uri_
    ) {
        payment_.functionStaticCall(
            abi.encodeWithSelector(
                IBEP20.decimals.selector,
                "HobbitPirate: This address is not token"
            )
        );
        oracle_.functionStaticCall(
            abi.encodeWithSelector(
                bytes4(hexStringToBytes.convert("48758697")),
                0,
                "HobbitPirate: This address is not nftOracle"
            )
        );

        _genExist.increment();

        _maxSupply = maxSupply_;
        saleInfo = nftSaleInfo(
            price_,
            payment_,
            oracle_
        );

        _name = name_;
        _symbol = symbol_;
        _setBaseURI(uri_);

        transferOwnership(owner_);
        _setDefaultRoyalty(owner_, 1000);
    }

    function resetSale(
        uint256 price_,
        uint256 saleSupply_,
        address payment_,
        address oracle_
    ) public virtual onlyOwner {
        require(
            totalSupply() == maxSupply(),
            "HobbitPirate: Reset supply available after reach max supply"
        );

        payment_.functionStaticCall(
            abi.encodeWithSelector(
                IBEP20.decimals.selector,
                "HobbitPirate: This address is not token"
            )
        );
        oracle_.functionStaticCall(
            abi.encodeWithSelector(
                bytes4(hexStringToBytes.convert("48758697")),
                0,
                "HobbitPirate: This address is not nftOracle"
            )
        );

        require(
            oracle_ != saleInfo.oracle,
            "HobbitPirate: Please provide new nftOracle address"
        );

        _genExist.increment();

        _maxSupply += saleSupply_;
        saleInfo = nftSaleInfo(
            price_,
            payment_,
            oracle_
        );
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, ERC2981, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "HobbitPirate: balance query for the zero address");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "HobbitPirate: owner query for nonexistent token");
        return owner;
    }

    function listTokenOf(address owner) public view virtual returns(uint256[] memory){
        unchecked {
            uint256 totalNft = totalSupply();
            uint256 balanceNft = balanceOf(owner);
            uint256[] memory temp = new uint256[](balanceNft);

            uint256 index;

            for(uint256 a = 1; a <= totalNft; a++){
                if(ownerOf(a) == owner){
                    temp[index] = a;
                    index += 1;
                }
            }

            return temp;
        }
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply.current();
    }

    function maxSupply() public view virtual returns (uint256) {
        return _maxSupply;
    }

    function lastExistId() public view virtual returns(uint256){
        return _nftExistId.current();
    }
    
    function rarityInfo(uint256 tokenId) public view virtual returns (nftInfo memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        return _nftGen[tokenId];
    }

    function salesInfo() public view virtual returns (
        uint256,
        uint256,
        address
    ) {
        return(
            _genExist.current(),
            saleInfo.price,
            saleInfo.payment
        );
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory base = baseURI();
        return bytes(base).length > 0 ? string(abi.encodePacked(base, tokenId.toString())) : "";
    }

    function baseURI() internal view virtual returns (string memory) {
        return _baseURI;
    }

    function approve(address to, uint256 tokenId) public virtual override {
        address owner = HobbitPirate.ownerOf(tokenId);
        require(to != owner, "HobbitPirate: approval to current owner");

        require(
            _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
            "HobbitPirate: approve caller is not owner nor approved for all"
        );

        _approve(to, tokenId);
    }

    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        require(_exists(tokenId), "HobbitPirate: approved query for nonexistent token");

        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), tokenId), "HobbitPirate: transfer caller is not owner nor approved");

        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "HobbitPirate: transfer caller is not owner nor approved");
        _safeTransfer(from, to, tokenId, _data);
    }

    function burn(uint256 tokenId) public virtual {
        //solhint-disable-next-line max-line-length
        require(_exists(tokenId), "HobbitPirate: operator query for nonexistent token");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "HobbitPirate: caller is not owner nor approved");
        _burn(tokenId);
        _totalSupply.decrement();
        _maxSupply -= 1;
        _nftGen[tokenId] = nftInfo(
            0,
            rariryLevel.common
        );
    }

    function buyNft() public virtual {
        require(
            totalSupply() < maxSupply(),
            "HobbitPirate: Max supply reached!"
        );

        IBEP20(saleInfo.payment).transferFrom(
            _msgSender(),
            owner(),
            saleInfo.price
        );

        _nftExistId.increment();

        rariryLevel rarity = rariryLevel(
            uint256(
                bytes32(
                    saleInfo.oracle.functionStaticCall(
                        abi.encodeWithSelector(
                            bytes4(hexStringToBytes.convert("48758697")),
                            _nftExistId.current(),
                            "HobbitPirate: This address is not nftOracle"
                        )
                    )
                )
            )
        );

        _safeMint(
            _msgSender(),
            _nftExistId.current()
        );
        _nftGen[_nftExistId.current()] = nftInfo(
            _genExist.current(),
            rarity
        );

        _totalSupply.increment();
    }

    function _safeTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal virtual {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, _data), "HobbitPirate: transfer to non ERC721Receiver implementer");
    }

    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _owners[tokenId] != address(0);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        require(_exists(tokenId), "HobbitPirate: operator query for nonexistent token");
        address owner = HobbitPirate.ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }

    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }

    function _safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal virtual {
        _mint(to, tokenId);
        require(
            _checkOnERC721Received(address(0), to, tokenId, _data),
            "HobbitPirate: transfer to non ERC721Receiver implementer"
        );
    }

    function _setBaseURI(string memory baseURI_) internal virtual {
        _baseURI = baseURI_;
    }

    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "HobbitPirate: mint to the zero address");
        require(!_exists(tokenId), "HobbitPirate: token already minted");

        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
    }

    function _burn(uint256 tokenId) internal virtual {
        address owner = HobbitPirate.ownerOf(tokenId);

        // Clear approvals
        _approve(address(0), tokenId);

        _balances[owner] -= 1;
        delete _owners[tokenId];

        emit Transfer(owner, address(0), tokenId);
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {
        require(HobbitPirate.ownerOf(tokenId) == from, "HobbitPirate: transfer from incorrect owner");
        require(to != address(0), "HobbitPirate: transfer to the zero address");

        _approve(address(0), tokenId);

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        if(from != address(0)){
            _setTokenRoyalty(tokenId, from, 1000);
        }

        emit Transfer(from, to, tokenId);
    }

    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApprovals[tokenId] = to;
        emit Approval(HobbitPirate.ownerOf(tokenId), to, tokenId);
    }

    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual {
        require(owner != operator, "HobbitPirate: approve to caller");
        _operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }

    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) private returns (bool) {
        if (to.isContract()) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, _data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("HobbitPirate: transfer to non ERC721Receiver implementer");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }
}