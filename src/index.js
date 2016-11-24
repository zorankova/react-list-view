import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import createFragment from 'react-addons-create-fragment';

import translate from './translate';

export default class ReactListView extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,

    renderItem: PropTypes.func.isRequired,

    rowCount: PropTypes.number,
    columnCount: PropTypes.number,
    rowHeight: PropTypes.number,
    columnWidth: PropTypes.number,

    // Controllables
    clientHeight: PropTypes.number,
    clientWidth: PropTypes.number,
    scrollTop: PropTypes.number,
    scrollLeft: PropTypes.number,
  };

  static defaultProps = {
    className: null,
    style: {},

    rowCount: 1,
    columnCount: 1,
    rowHeight: 0,
    columnWidth: 0,

    clientHeight: -1,
    clientWidth: -1,
    scrollTop: -1,
    scrollLeft: -1,
  };

  constructor(props, context) {
    super(props, context);

    this._isControlled = (
      props.clientHeight !== -1 ||
      props.clientWidth !== -1
    );
    if (!this._isControlled) {
      this.state = {
        clientHeight: -1,
        clientWidth: -1,
        scrollTop: -1,
        scrollLeft: -1,
      };
    }

    this.state = {
      initialListPosition: 0,
      initialMousePosition: 0,
      isDragging: false
    };

    this._handleScroll = this._handleScroll.bind(this);
  }

  componentDidMount() {
    if (!this._isControlled) {
      let {
        clientHeight,
        clientWidth,
        scrollTop,
        scrollLeft,
      } = ReactDOM.findDOMNode(this);
      this.setState({ clientHeight, clientWidth, scrollTop, scrollLeft });
    }
  }

  _handleScroll(e) {
    this.setState({
      scrollTop: e.target.scrollTop,
      scrollLeft: e.target.scrollLeft,
    });
  }

  _getBoundaries(scroll, itemDimension, clientDimension, maxDimension) {
    let min = Math.floor(scroll / itemDimension);
    let max = Math.min(
      maxDimension,
      min + Math.ceil(clientDimension / itemDimension)
    );
    return [min, max];
  }

  mouseMove = (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (this.state.isDragging) {
          let pos = (event.pageX - this.state.initialMousePosition) + this.state.initialListPosition;
          this.setState({scrollLeft: pos});
      }
  };

  mouseDown = (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.setState({isDragging: true, initialMousePosition: event.pageX, initialListPosition: this.state.scrollLeft});
      // console.log(this.state.leftOffset);
  };
  mouseUp = () => {
      event.stopPropagation();
      event.preventDefault();
      console.log(this.state.leftOffset);
      this.setState({isDragging: false});
  };

  render() {
    let {
      style,
      className,
      renderItem,
      rowCount,
      columnCount,
      rowHeight,
      columnWidth,
    } = this.props;

    let {
      scrollTop,
      scrollLeft,
      clientHeight,
      clientWidth,
    } = this._isControlled ? this.props : this.state;

    let minY, maxY;
    if (clientHeight === -1) {
      [minX, maxX] = [0, -1];
    } else if (rowHeight > 0) {
      [minY, maxY] = this._getBoundaries(
        scrollTop,
        rowHeight,
        clientHeight,
        rowCount - 1
      );
    } else {
      [minY, maxY] = [0, 0];
    }

    let minX, maxX;
    if (clientWidth === -1) {
      [minX, maxX] = [0, -1];
    } else if (columnWidth > 0) {
      [minX, maxX] = this._getBoundaries(
        scrollLeft,
        columnWidth,
        clientWidth,
        columnCount - 1
      );
    } else {
      [minX, maxX] = [0, 0];
    }

    let items = {};
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        items[`${x},${y}`] = renderItem(
          x,
          y,
          translate(x * columnWidth, y * rowHeight, true)
        );
      }
    }

    let listViewClassName = 'ReactListView';
    if (className) {
      listViewClassName += ' ' + className;
    }

    return (
      <div
        className={listViewClassName}
        style={{
          position: 'relative',
          overflow: 'auto',
          // As per the CSS3 2D transform spec, transformed elements act as a
          // containing block for fixed positioned descendants.
          // Do not create a containing block if the component isn't controlled:
          // the user should define their own containing block.
          // See https://github.com/Morhaus/react-list-view/issues/2
          ...(this._isControlled ? {} : translate(0, 0, 0)),
          ...style,
        }}
        onScroll={!this._isControlled && this._handleScroll}
        onMouseUp={this.mouseUp}
        onMouseDown={this.mouseDown}
        onMouseMove={this.mouseMove}
      >
        <div
          className="ReactListView-container"
          style={{
            overflow: 'hidden',
            height: rowHeight !== 0 ? `${rowHeight * rowCount}px` : '100%',
            width: columnWidth !== 0 ? `${columnWidth * columnCount}px` : 'auto',
          }}
        >
          {createFragment(items)}
        </div>
      </div>
    );
  }

}
